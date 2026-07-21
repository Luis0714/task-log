import "server-only";

import { cache } from "react";

import { catalogToSprintContext } from "@/lib/ado/sprint-data-context";
import {
  firstSprintDataError,
  loadSprintBacklogStates,
  loadSprintBugStates,
  loadSprintPeriodBugs,
  loadSprintWorkItems,
} from "@/lib/ado/load-sprint-data";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { buildSprintStatusMapping, type SprintStatusMapping } from "@/lib/dashboard/sprint-status-mapping";
import type { AdoTaskStateDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { WORK_ITEM_ASSIGNEE_ALL } from "@/lib/schemas/work-item-filters";

export type WorkItemsBaseSnapshot = {
  sprintWorkItems: AdoWorkItemOptionDto[];
  sprintBugs: AdoWorkItemOptionDto[];
  backlogStates: AdoTaskStateDto[];
  bugStates: AdoTaskStateDto[];
  userStoryMapping: SprintStatusMapping;
  bugMapping: SprintStatusMapping;
  error: string | null;
};

const emptySnapshot: WorkItemsBaseSnapshot = {
  sprintWorkItems: [],
  sprintBugs: [],
  backlogStates: [],
  bugStates: [],
  userStoryMapping: { pending: [], inProgress: [], completed: [] },
  bugMapping: { pending: [], inProgress: [], completed: [] },
  error: null,
};

export const loadWorkItemsBase = cache(async function loadWorkItemsBase(
  catalog: AdoCatalogSnapshot,
  assignee: string,
): Promise<WorkItemsBaseSnapshot> {
  const ctx = catalogToSprintContext(catalog, assignee);
  if (!ctx) return emptySnapshot;

  // Mismo criterio que el Dashboard y los módulos de Bugs/Tareas: el
  // sprint solo aporta el rango de fechas; los bugs se consultan por
  // fecha de creación, no por `System.IterationPath`.
  const bugsCtx = { ...ctx, assignee: WORK_ITEM_ASSIGNEE_ALL };
  const [workItems, bugs, backlogStates, bugStates] = await Promise.all([
    loadSprintWorkItems(ctx.project, ctx.sprintPath, ctx.assignee),
    loadSprintPeriodBugs(
      bugsCtx.project,
      bugsCtx.team,
      bugsCtx.sprintPath,
      bugsCtx.sprintStartDate,
      bugsCtx.sprintFinishDate,
      bugsCtx.assignee,
    ),
    loadSprintBacklogStates(ctx.project),
    loadSprintBugStates(ctx.project),
  ]);

  const error = firstSprintDataError(workItems, bugs, backlogStates, bugStates);
  const userStoryMapping = buildSprintStatusMapping(backlogStates.data);
  const bugMapping = buildSprintStatusMapping(bugStates.data);

  return {
    sprintWorkItems: workItems.data,
    sprintBugs: bugs.data,
    backlogStates: backlogStates.data,
    bugStates: bugStates.data,
    userStoryMapping,
    bugMapping,
    error,
  };
});