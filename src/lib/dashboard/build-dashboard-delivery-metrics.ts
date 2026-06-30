import { buildSprintStatusMapping } from "@/lib/dashboard/sprint-status-mapping";
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
import type { AdoWorkItemTypeState } from "@/lib/azure-devops/work-item-type-states";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

export type BuildDashboardDeliveryMetricsInput = {
  workItems: AdoWorkItemOptionDto[];
  bugs: AdoWorkItemOptionDto[];
  backlogStates: readonly AdoWorkItemTypeState[];
  bugStates: readonly AdoWorkItemTypeState[];
};

export function buildDashboardDeliveryMetrics({
  workItems,
  bugs,
  backlogStates,
  bugStates,
}: BuildDashboardDeliveryMetricsInput): DashboardDeliveryMetrics {
  const userStoryMapping = buildSprintStatusMapping(backlogStates);
  const bugMapping = buildSprintStatusMapping(bugStates);

  const assigned = mapToDashboardWorkItems(workItems);
  const assignedBugs = mapToDashboardWorkItems(bugs);
  const sprintStatusOverview = computeSprintStatusOverview(assigned, assignedBugs, {
    userStories: userStoryMapping,
    bugs: bugMapping,
  });

  return computeDashboardMetrics(EMPTY_HOURS_BREAKDOWN, {
    sprintStatusOverview,
    storyPointsAssigned: computeAssignedStoryPoints(assigned),
    storyPointsDeveloped: computeDevelopedStoryPoints(assigned, userStoryMapping),
    pbiProgress: computeSprintPbiProgress(assigned, userStoryMapping),
  });
}