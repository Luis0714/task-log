import {
  countWorkItemsInCategory,
  stateMatchesCompletedState,
  type SprintStatusMapping,
} from "@/lib/dashboard/sprint-status-mapping";
import type { DashboardWorkItem, SprintStatusOverview, WorkItemStatusCounts } from "@/lib/dashboard/types";
import { classifyUserStoryWorkflow } from "@/lib/work-items/user-story-workflow-status";

export const EMPTY_WORK_ITEM_STATUS_COUNTS: WorkItemStatusCounts = {
  assigned: 0,
  pending: 0,
  inProgress: 0,
  completed: 0,
};

export const EMPTY_SPRINT_STATUS_OVERVIEW: SprintStatusOverview = {
  userStories: EMPTY_WORK_ITEM_STATUS_COUNTS,
  bugs: EMPTY_WORK_ITEM_STATUS_COUNTS,
};

export function computeWorkItemStatusCounts(
  items: readonly DashboardWorkItem[],
  mapping: SprintStatusMapping,
): WorkItemStatusCounts {
  return {
    assigned: items.length,
    pending: countWorkItemsInCategory(items, mapping.pending),
    inProgress: countWorkItemsInCategory(items, mapping.inProgress),
    completed: items.filter((item) => stateMatchesCompletedState(item.state, mapping)).length,
  };
}

export function computeUserStoryStatusCounts(
  items: readonly DashboardWorkItem[],
): WorkItemStatusCounts {
  let pending = 0;
  let inProgress = 0;
  let completed = 0;

  for (const item of items) {
    const category = classifyUserStoryWorkflow(item);
    if (category === "developed") completed += 1;
    else if (category === "inProgress") inProgress += 1;
    else if (category === "pending") pending += 1;
  }

  return {
    assigned: items.length,
    pending,
    inProgress,
    completed,
  };
}

export function computeSprintStatusOverview(
  userStories: readonly DashboardWorkItem[],
  bugs: readonly DashboardWorkItem[],
  mappings: {
    userStories: SprintStatusMapping;
    bugs: SprintStatusMapping;
  },
): SprintStatusOverview {
  return {
    userStories: computeUserStoryStatusCounts(userStories),
    bugs: computeWorkItemStatusCounts(bugs, mappings.bugs),
  };
}
