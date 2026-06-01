import "server-only";

import {
  firstSprintDataError,
  loadSprintBacklogStates,
  loadSprintBugs,
  loadSprintNonWorkingDates,
  loadSprintTasks,
  loadSprintWorkItems,
} from "@/lib/ado/load-sprint-data";
import { isDatabaseConfigured } from "@/lib/db/client";
import { getRepositories } from "@/lib/db/container";
import type {
  SprintGoalScope,
  SprintStoryGoalRecord,
} from "@/lib/db/ports/sprint-story-goal.repository.port";
import { logApiError } from "@/lib/errors/log-api-error";
import { WORK_ITEM_ASSIGNEE_ALL } from "@/lib/schemas/work-item-filters";
import { loadAssigneeFilterMembers } from "@/lib/filters/load-assignee-filter-members";
import { buildSprintGoalMetrics } from "@/lib/sprints/build-sprint-goal-metrics";
import { buildSprintOperationalMetrics } from "@/lib/sprints/build-sprint-operational-metrics";
import { buildSprintTimesSharePayload } from "@/lib/sprints/build-sprint-times-share-payload";
import {
  canShareSprintTimes,
  isSprintTimesShareVariantEnabled,
} from "@/lib/sprints/sprint-times-share-eligibility";
import { resolveSprintStatsScope, SPRINT_STATS_GOAL_ONLY_DEFAULT } from "@/lib/sprints/filter-sprint-stats-scope";
import { isSprintScopeFinalized } from "@/lib/sprints/is-sprint-scope-finalized";
import { loadProjectWorkItemTags } from "@/lib/sprints/load-project-work-item-tags";
import { loadSprintSnapshotScreen } from "@/lib/sprints/load-sprint-snapshot-screen";
import { resolveSnapshotOperationalMetrics } from "@/lib/sprints/parse-sprint-snapshot-stats-payload";
import { SPRINT_TIMES_SHARE_LABELS } from "@/lib/sprints/sprint-times-share-labels";
import type { SprintTimesSharePayload } from "@/lib/sprints/sprint-times-share-types";
import type { SprintTimesMetrics } from "@/lib/sprints/sprint-stats-types";
import type { SprintTimesShareQueryDto } from "@/lib/schemas/sprint-times-share";

export type LoadSprintTimesSharePayloadResult =
  | { ok: true; payload: SprintTimesSharePayload }
  | { ok: false; error: string; status: number };

async function loadLiveSprintTimesMetrics(
  scope: SprintGoalScope,
  options: {
    goalOnly: boolean;
    sprintStartDate?: string;
    sprintFinishDate?: string;
  },
): Promise<{ times: SprintTimesMetrics | null; error: string | null }> {
  const [workItemsPart, bugsPart, tasksPart, backlogStatesPart, tagsPart, nonWorkingDatesPart, assigneeRoster] =
    await Promise.all([
      loadSprintWorkItems(scope.project, scope.sprintPath, WORK_ITEM_ASSIGNEE_ALL),
      loadSprintBugs(scope.project, scope.sprintPath, WORK_ITEM_ASSIGNEE_ALL),
      loadSprintTasks(scope.project, scope.sprintPath, WORK_ITEM_ASSIGNEE_ALL),
      loadSprintBacklogStates(scope.project),
      loadProjectWorkItemTags(scope.project),
      loadSprintNonWorkingDates(scope.project, scope.team),
      loadAssigneeFilterMembers(scope.project, scope.team, scope.sprintPath, "workItems"),
    ]);

  const adoError = firstSprintDataError(
    workItemsPart,
    bugsPart,
    tasksPart,
    backlogStatesPart,
    nonWorkingDatesPart,
  );
  const error = adoError ?? tagsPart.error;

  if (error) {
    return { times: null, error };
  }

  let goals: SprintStoryGoalRecord[] = [];
  let generalObjective = "";

  if (isDatabaseConfigured()) {
    try {
      const [storyGoals, sprintGoal] = await Promise.all([
        getRepositories().sprintStoryGoal.listByScope(scope),
        getRepositories().sprintGoal.getByScope(scope),
      ]);
      goals = storyGoals;
      generalObjective = sprintGoal?.generalObjective?.trim() ?? "";
    } catch (cause) {
      logApiError("loadLiveSprintTimesMetrics/goals", cause);
    }
  }

  const goal = buildSprintGoalMetrics({
    workItems: workItemsPart.data,
    goals,
    catalogTags: tagsPart.tags,
    backlogStateOrder: backlogStatesPart.data.map((state) => state.name),
    generalObjective,
  });

  const operational = buildSprintOperationalMetrics({
    workItems: workItemsPart.data,
    bugs: bugsPart.data,
    tasks: tasksPart.data,
    backlogStates: backlogStatesPart.data,
    goalWorkItemIds: new Set(goal.goalWorkItemIds),
    scope: resolveSprintStatsScope(options.goalOnly),
    sprintStartDate: options.sprintStartDate,
    sprintFinishDate: options.sprintFinishDate,
    nonWorkingDates: nonWorkingDatesPart.data,
    assigneeRoster,
  });

  return { times: operational.times, error: null };
}

async function loadFrozenSprintTimesMetrics(
  scope: SprintGoalScope,
  goalOnly: boolean,
): Promise<{ times: SprintTimesMetrics | null; error: string | null }> {
  const screen = await loadSprintSnapshotScreen(scope);

  if (screen.error) {
    return { times: null, error: screen.error };
  }

  if (!screen.snapshot?.statsPayload) {
    return {
      times: null,
      error: "Esta retrospectiva no incluye tiempos congelados para compartir.",
    };
  }

  const operational = resolveSnapshotOperationalMetrics(
    screen.snapshot.statsPayload,
    resolveSprintStatsScope(goalOnly),
  );

  return { times: operational.times, error: null };
}

export async function loadSprintTimesSharePayloadForRequest(
  organization: string,
  query: SprintTimesShareQueryDto,
): Promise<LoadSprintTimesSharePayloadResult> {
  const scope: SprintGoalScope = {
    organization,
    project: query.project,
    team: query.team,
    sprintPath: query.sprintPath,
  };

  const goalOnly = query.goalOnly ?? SPRINT_STATS_GOAL_ONLY_DEFAULT;
  const finalized = await isSprintScopeFinalized(scope);

  const loaded = finalized
    ? await loadFrozenSprintTimesMetrics(scope, goalOnly)
    : await loadLiveSprintTimesMetrics(scope, {
        goalOnly,
        sprintStartDate: query.sprintStartDate,
        sprintFinishDate: query.sprintFinishDate,
      });

  if (loaded.error) {
    return { ok: false, error: loaded.error, status: 502 };
  }

  const times = loaded.times;

  if (!times || !canShareSprintTimes(times)) {
    return {
      ok: false,
      error: "No hay tiempos registrados para compartir en el alcance seleccionado.",
      status: 404,
    };
  }

  if (!isSprintTimesShareVariantEnabled(times, query.variant)) {
    return {
      ok: false,
      error: "La variante seleccionada no está disponible para este sprint.",
      status: 400,
    };
  }

  const payload = buildSprintTimesSharePayload(times, {
    projectName: query.project,
    teamName: query.team,
    sprintName: query.sprintName,
    sprintStartDate: query.sprintStartDate,
    sprintFinishDate: query.sprintFinishDate,
    goalOnly,
    dataSourceLabel: finalized
      ? SPRINT_TIMES_SHARE_LABELS.frozenDataSource
      : SPRINT_TIMES_SHARE_LABELS.liveDataSource,
    variant: query.variant,
  });

  return { ok: true, payload };
}
