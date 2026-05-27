import {
  BUG_STATUS_MAPPING,
  USER_STORY_STATUS_MAPPING,
} from "@/lib/dashboard/sprint-status-mapping";
import { computeSprintStatusOverview } from "@/lib/dashboard/sprint-status-overview";
import type { DashboardDeliveryMetrics } from "@/lib/dashboard/types";
import {
  computeAssignedStoryPoints,
  computeDevelopedStoryPoints,
  computeDashboardMetrics,
  computeSprintPbiProgress,
  mapToDashboardWorkItems,
} from "@/lib/dashboard/work-item-selectors";
import { EMPTY_HOURS_BREAKDOWN } from "@/lib/dashboard/hours-breakdown";
import { collectWorkItemStates } from "@/lib/time-log/filter-work-items";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

export function buildDashboardDeliveryMetrics(
  workItems: AdoWorkItemOptionDto[],
  bugs: AdoWorkItemOptionDto[],
): DashboardDeliveryMetrics {
  const assigned = mapToDashboardWorkItems(workItems);
  const assignedBugs = mapToDashboardWorkItems(bugs);
  const workItemStates = collectWorkItemStates(workItems);
  const sprintStatusOverview = computeSprintStatusOverview(assigned, assignedBugs, {
    userStories: USER_STORY_STATUS_MAPPING,
    bugs: BUG_STATUS_MAPPING,
  });

  return computeDashboardMetrics(EMPTY_HOURS_BREAKDOWN, {
    sprintStatusOverview,
    storyPointsAssigned: computeAssignedStoryPoints(assigned),
    storyPointsDeveloped: computeDevelopedStoryPoints(assigned),
    pbiProgress: computeSprintPbiProgress(assigned, workItemStates),
  });
}
