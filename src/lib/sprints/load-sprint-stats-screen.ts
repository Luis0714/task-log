import "server-only";

import { cache } from "react";

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
import type { SprintGoalScope, SprintStoryGoalRecord } from "@/lib/db/ports/sprint-story-goal.repository.port";
import { logApiError } from "@/lib/errors/log-api-error";
import { WORK_ITEM_ASSIGNEE_ALL } from "@/lib/schemas/work-item-filters";
import { loadAssigneeFilterMembers } from "@/lib/filters/load-assignee-filter-members";
import { buildSprintOperationalMetrics } from "@/lib/sprints/build-sprint-operational-metrics";
import { buildSprintGoalMetrics } from "@/lib/sprints/build-sprint-goal-metrics";
import { resolveSprintStatsScope, SPRINT_STATS_GOAL_ONLY_DEFAULT } from "@/lib/sprints/filter-sprint-stats-scope";
import { isSprintScopeFinalized } from "@/lib/sprints/is-sprint-scope-finalized";
import { loadProjectWorkItemTags } from "@/lib/sprints/load-project-work-item-tags";
import type { SprintStatsScreenData } from "@/lib/sprints/sprint-stats-types";

export type LoadSprintStatsScreenOptions = {
  goalOnly?: boolean;
  sprintStartDate?: string | null;
  sprintFinishDate?: string | null;
};

export type SprintStatsScreenSnapshot = {
  stats: SprintStatsScreenData | null;
  persistenceReady: boolean;
  isFinalized: boolean;
  error: string | null;
};

export const loadSprintStatsScreen = cache(async function loadSprintStatsScreen(
  scope: SprintGoalScope,
  options: LoadSprintStatsScreenOptions = {},
): Promise<SprintStatsScreenSnapshot> {
  const goalOnly = options.goalOnly ?? SPRINT_STATS_GOAL_ONLY_DEFAULT;
  const persistenceReady = isDatabaseConfigured();
  let isFinalized = false;

  if (persistenceReady) {
    try {
      isFinalized = await isSprintScopeFinalized(scope);
    } catch (cause) {
      logApiError("loadSprintStatsScreen/finalized", cause);
    }
  }

  if (isFinalized) {
    return {
      stats: null,
      persistenceReady,
      isFinalized: true,
      error: null,
    };
  }

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
    return {
      stats: null,
      persistenceReady,
      isFinalized: false,
      error,
    };
  }

  let goals: SprintStoryGoalRecord[] = [];
  let generalObjective = "";

  if (persistenceReady) {
    try {
      const [storyGoals, sprintGoal] = await Promise.all([
        getRepositories().sprintStoryGoal.listByScope(scope),
        getRepositories().sprintGoal.getByScope(scope),
      ]);
      goals = storyGoals;
      generalObjective = sprintGoal?.generalObjective?.trim() ?? "";
    } catch (cause) {
      logApiError("loadSprintStatsScreen/goals", cause);
    }
  }

  const backlogStateOrder = backlogStatesPart.data.map((state) => state.name);
  const goal = buildSprintGoalMetrics({
    workItems: workItemsPart.data,
    goals,
    catalogTags: tagsPart.tags,
    backlogStateOrder,
    generalObjective,
  });

  const operational = buildSprintOperationalMetrics({
    workItems: workItemsPart.data,
    bugs: bugsPart.data,
    tasks: tasksPart.data,
    backlogStates: backlogStatesPart.data,
    goalWorkItemIds: new Set(goal.goalWorkItemIds),
    scope: resolveSprintStatsScope(goalOnly),
    sprintStartDate: options.sprintStartDate,
    sprintFinishDate: options.sprintFinishDate,
    nonWorkingDates: nonWorkingDatesPart.data,
    assigneeRoster,
  });

  return {
    stats: { goal, ...operational },
    persistenceReady,
    isFinalized: false,
    error: null,
  };
});
