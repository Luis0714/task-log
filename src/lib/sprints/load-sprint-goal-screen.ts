import "server-only";

import { cache } from "react";

import {
  firstSprintDataError,
  loadSprintBacklogStates,
  loadSprintWorkItems,
} from "@/lib/ado/load-sprint-data";
import { isDatabaseConfigured } from "@/lib/db/client";
import { getRepositories } from "@/lib/db/container";
import type { SprintGoalScope, SprintStoryGoalRecord } from "@/lib/db/ports/sprint-story-goal.repository.port";
import { logApiError } from "@/lib/errors/log-api-error";
import type {
  AdoTaskStateDto,
  AdoWorkItemTagDto,
} from "@/lib/schemas/ado-catalog";
import { WORK_ITEM_ASSIGNEE_ALL } from "@/lib/schemas/work-item-filters";
import { loadProjectWorkItemTags } from "@/lib/sprints/load-project-work-item-tags";
import { buildSprintStoryGoalRows } from "@/lib/sprints/sprint-story-goal";
import type { SprintStoryGoalRowModel } from "@/lib/sprints/sprint-story-goal";

export type SprintGoalScreenSnapshot = {
  rows: SprintStoryGoalRowModel[];
  backlogStates: AdoTaskStateDto[];
  catalogTags: AdoWorkItemTagDto[];
  generalObjective: string;
  persistenceReady: boolean;
  error: string | null;
};

export const loadSprintGoalScreen = cache(async function loadSprintGoalScreen(
  scope: SprintGoalScope,
): Promise<SprintGoalScreenSnapshot> {
  const [workItemsPart, backlogStatesPart, tagsPart] = await Promise.all([
    loadSprintWorkItems(scope.project, scope.sprintPath, WORK_ITEM_ASSIGNEE_ALL),
    loadSprintBacklogStates(scope.project),
    loadProjectWorkItemTags(scope.project),
  ]);

  const adoError = firstSprintDataError(workItemsPart, backlogStatesPart);
  const tagsError = tagsPart.error;
  const error = adoError ?? tagsError;

  let goals: SprintStoryGoalRecord[] = [];
  let generalObjective = "";
  let persistenceReady = isDatabaseConfigured();

  if (persistenceReady) {
    try {
      const [storyGoals, sprintGoal] = await Promise.all([
        getRepositories().sprintStoryGoal.listByScope(scope),
        getRepositories().sprintGoal.getByScope(scope),
      ]);
      goals = storyGoals;
      generalObjective = sprintGoal?.generalObjective?.trim() ?? "";
    } catch (cause) {
      logApiError("loadSprintGoalScreen/goals", cause);
      persistenceReady = false;
    }
  }

  return {
    rows: buildSprintStoryGoalRows(workItemsPart.data, goals),
    backlogStates: backlogStatesPart.data,
    catalogTags: tagsPart.tags,
    generalObjective,
    persistenceReady,
    error,
  };
});
