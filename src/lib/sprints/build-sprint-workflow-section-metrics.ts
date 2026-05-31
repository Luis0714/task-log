import type { AdoTaskStateDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { buildDashboardWorkflowMetrics } from "@/lib/dashboard/build-dashboard-workflow-metrics";
import { buildPbiStateBars } from "@/lib/dashboard/pbi-state-chart-data";
import type { SprintWorkflowSectionMetrics } from "@/lib/sprints/sprint-stats-types";

export function buildSprintWorkflowSectionMetrics(
  workItems: readonly AdoWorkItemOptionDto[],
  backlogStates: readonly AdoTaskStateDto[],
): SprintWorkflowSectionMetrics {
  const workflow = buildDashboardWorkflowMetrics([...workItems], [...backlogStates]);

  return {
    pbiProgress: workflow.pbiProgress,
    stateBars: buildPbiStateBars(workflow.pbiStateGroups),
  };
}
