import {
  countWorkItemsInCategory,
  stateMatchesCompletedState,
  type SprintStatusMapping,
} from "@/lib/dashboard/sprint-status-mapping";
import type { DashboardWorkItem, SprintStatusOverview, WorkItemStatusCounts } from "@/lib/dashboard/types";

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

export function computeSprintStatusOverview(
  userStories: readonly DashboardWorkItem[],
  bugs: readonly DashboardWorkItem[],
  mappings: {
    userStories: SprintStatusMapping;
    bugs: SprintStatusMapping;
  },
): SprintStatusOverview {
  return {
    userStories: computeWorkItemStatusCounts(userStories, mappings.userStories),
    bugs: computeWorkItemStatusCounts(bugs, mappings.bugs),
  };
}
