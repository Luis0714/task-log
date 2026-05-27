import "server-only";

import { cache } from "react";

import { catalogToSprintContext } from "@/lib/ado/sprint-data-context";
import {
  firstSprintDataError,
  loadSprintBugs,
  loadSprintWorkItems,
} from "@/lib/ado/load-sprint-data";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { WORK_ITEM_ASSIGNEE_ALL } from "@/lib/schemas/work-item-filters";

export type WorkItemsBaseSnapshot = {
  sprintWorkItems: AdoWorkItemOptionDto[];
  sprintBugs: AdoWorkItemOptionDto[];
  error: string | null;
};

export const loadWorkItemsBase = cache(async function loadWorkItemsBase(
  catalog: AdoCatalogSnapshot,
  assignee: string,
): Promise<WorkItemsBaseSnapshot> {
  const ctx = catalogToSprintContext(catalog, assignee);
  if (!ctx) {
    return { sprintWorkItems: [], sprintBugs: [], error: null };
  }

  const bugsCtx = { ...ctx, assignee: WORK_ITEM_ASSIGNEE_ALL };
  const [workItems, bugs] = await Promise.all([
    loadSprintWorkItems(ctx.project, ctx.sprintPath, ctx.assignee),
    loadSprintBugs(bugsCtx.project, bugsCtx.sprintPath, bugsCtx.assignee),
  ]);

  const error = firstSprintDataError(workItems, bugs);
  return {
    sprintWorkItems: workItems.data,
    sprintBugs: bugs.data,
    error,
  };
});
