import "server-only";

import {
  firstSprintDataError,
  loadSprintBacklogStates,
  loadSprintHolidayDates,
  loadSprintPeriodBugs,
  loadSprintPeriodTasks,
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
import { loadTeamMembers } from "@/lib/filters/load-team-members";
import { loadTeamAssignmentSegmentsByAssignee } from "@/lib/ado/load-team-assignment-segments";
import { buildSprintGoalMetrics } from "@/lib/sprints/build-sprint-goal-metrics";
import { buildSprintOperationalMetrics } from "@/lib/sprints/build-sprint-operational-metrics";
import { resolveSprintStatsScope } from "@/lib/sprints/filter-sprint-stats-scope";
import { loadProjectWorkItemTags } from "@/lib/sprints/load-project-work-item-tags";
import { loadSprintNewsSolicitudes } from "@/lib/sprints/load-sprint-news-solicitudes";

export type LoadLiveSprintMetricsOptions = {
  goalOnly: boolean;
  sprintStartDate?: string | null;
  sprintFinishDate?: string | null;
};

export type LiveSprintMetrics = {
  goal: ReturnType<typeof buildSprintGoalMetrics>;
  operational: ReturnType<typeof buildSprintOperationalMetrics>;
};

export type LoadLiveSprintMetricsResult =
  | { metrics: LiveSprintMetrics; error: null }
  | { metrics: null; error: string };

/**
 * Carga los datos vivos de ADO para un sprint y construye las métricas de
 * objetivo y operativas. Pipeline compartido por la pantalla de stats y el
 * share de tiempos.
 */
export async function loadLiveSprintMetrics(
  scope: SprintGoalScope,
  options: LoadLiveSprintMetricsOptions,
): Promise<LoadLiveSprintMetricsResult> {
  const [workItemsPart, bugsPart, tasksPart, backlogStatesPart, tagsPart, nonWorkingDatesPart, assigneeRoster, newsSolicitudes] =
    await Promise.all([
      loadSprintWorkItems(scope.project, scope.sprintPath, WORK_ITEM_ASSIGNEE_ALL),
      loadSprintPeriodBugs(
        scope.project,
        scope.team,
        scope.sprintPath,
        options.sprintStartDate ?? null,
        options.sprintFinishDate ?? null,
        WORK_ITEM_ASSIGNEE_ALL,
      ),
      loadSprintPeriodTasks(
        scope.project,
        scope.team,
        scope.sprintPath,
        options.sprintStartDate ?? null,
        options.sprintFinishDate ?? null,
        WORK_ITEM_ASSIGNEE_ALL,
      ),
      loadSprintBacklogStates(scope.project),
      loadProjectWorkItemTags(scope.project),
      loadSprintHolidayDates(
        options.sprintStartDate ?? null,
        options.sprintFinishDate ?? null,
      ),
      loadTeamMembers({
        project: scope.project,
        team: scope.team,
      }),
      loadSprintNewsSolicitudes({
        projectId: scope.project,
        teamId: scope.team,
        sprintStartDate: options.sprintStartDate,
        sprintFinishDate: options.sprintFinishDate,
      }),
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
    return { metrics: null, error };
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
      logApiError("loadLiveSprintMetrics/goals", cause);
    }
  }

  const goal = buildSprintGoalMetrics({
    workItems: workItemsPart.data,
    goals,
    catalogTags: tagsPart.tags,
    backlogStateOrder: backlogStatesPart.data.map((state) => state.name),
    generalObjective,
  });

  const assignmentSegmentsByAssignee = await loadTeamAssignmentSegmentsByAssignee({
    projectId: scope.project,
    teamId: scope.team,
    sprintStartDate: options.sprintStartDate,
    sprintFinishDate: options.sprintFinishDate,
    roster: assigneeRoster,
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
    assignmentSegmentsByAssignee,
    newsSolicitudes,
  });

  return { metrics: { goal, operational }, error: null };
}
