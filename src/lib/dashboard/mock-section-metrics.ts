import { MOCK_DASHBOARD_METRICS } from "@/lib/dashboard/mock-data";
import { buildPbiStateBars } from "@/lib/dashboard/pbi-state-chart-data";
import type { DashboardDeliveryMetrics } from "@/lib/dashboard/types";
import type { SprintWorkflowSectionMetrics } from "@/lib/sprints/sprint-stats-types";

export const MOCK_SPRINT_DAY_KEY =
  MOCK_DASHBOARD_METRICS.hoursByDay[0]?.dayKey ?? "2026-03-03";

export const MOCK_DELIVERY_METRICS: DashboardDeliveryMetrics = {
  sprintStatusOverview: MOCK_DASHBOARD_METRICS.sprintStatusOverview,
  storyPointsAssigned: MOCK_DASHBOARD_METRICS.storyPointsAssigned,
  storyPointsDeveloped: MOCK_DASHBOARD_METRICS.storyPointsDeveloped,
  pbiProgress: MOCK_DASHBOARD_METRICS.pbiProgress,
};

export const MOCK_WORKFLOW_METRICS: SprintWorkflowSectionMetrics = {
  pbiProgress: MOCK_DASHBOARD_METRICS.pbiProgress,
  stateBars: buildPbiStateBars(MOCK_DASHBOARD_METRICS.pbiStateGroups),
};
