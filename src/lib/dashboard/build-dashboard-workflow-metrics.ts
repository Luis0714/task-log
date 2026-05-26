import type { DashboardWorkflowMetrics } from "@/lib/dashboard/types";
import {
  computeDashboardMetrics,
  computeSprintPbiProgress,
  mapToDashboardWorkItems,
} from "@/lib/dashboard/work-item-selectors";
import { EMPTY_HOURS_BREAKDOWN } from "@/lib/dashboard/hours-breakdown";
import {
  collectWorkItemStates,
  groupWorkItemsByStates,
} from "@/lib/time-log/filter-work-items";
import type { AdoTaskStateDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

export function buildDashboardWorkflowMetrics(
  workItems: AdoWorkItemOptionDto[],
  backlogStates: AdoTaskStateDto[],
): DashboardWorkflowMetrics {
  const assigned = mapToDashboardWorkItems(workItems);
  const workItemStates = backlogStates.map((state) => state.name);
  const stateOrder =
    workItemStates.length > 0 ? workItemStates : collectWorkItemStates(workItems);
  const pbiStateGroups = groupWorkItemsByStates(assigned, stateOrder);

  return computeDashboardMetrics(EMPTY_HOURS_BREAKDOWN, {
    pbiStateGroups,
    pbiProgress: computeSprintPbiProgress(assigned, workItemStates),
  });
}
