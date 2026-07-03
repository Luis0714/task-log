import { buildSprintStatusMapping } from "@/lib/dashboard/sprint-status-mapping";
import { computeSprintStatusOverview } from "@/lib/dashboard/sprint-status-overview";
import type { DashboardDeliveryMetrics } from "@/lib/dashboard/types";
import {
  computeAssignedStoryPoints,
  computeDevelopedStoryPoints,
  computeSprintPbiProgress,
  mapToDashboardWorkItems,
} from "@/lib/dashboard/work-item-selectors";
import type { AdoWorkItemTypeState } from "@/lib/azure-devops/work-item-type-states";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import {
  collectWorkItemStates,
  groupWorkItemsByStates,
} from "@/lib/azure-devops/work-items-filters";

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

  const backlogStateOrder = backlogStates.length > 0
    ? backlogStates.map((s) => s.name)
    : collectWorkItemStates(workItems);
  const bugStateOrder = bugStates.length > 0
    ? bugStates.map((s) => s.name)
    : collectWorkItemStates(bugs);

  return {
    sprintStatusOverview,
    storyPointsAssigned: computeAssignedStoryPoints(assigned),
    storyPointsDeveloped: computeDevelopedStoryPoints(assigned, userStoryMapping),
    pbiProgress: computeSprintPbiProgress(assigned, userStoryMapping),
    huStateGroups: groupWorkItemsByStates(assigned, backlogStateOrder).filter(
      (g) => g.items.length > 0,
    ),
    bugStateGroups: groupWorkItemsByStates(assignedBugs, bugStateOrder).filter(
      (g) => g.items.length > 0,
    ),
  };
}