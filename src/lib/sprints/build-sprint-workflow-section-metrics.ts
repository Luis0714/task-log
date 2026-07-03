import type { AdoTaskStateDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { buildDashboardWorkflowMetrics } from "@/lib/dashboard/build-dashboard-workflow-metrics";
import type { SprintWorkflowSectionMetrics } from "@/lib/sprints/sprint-stats-types";

export function buildSprintWorkflowSectionMetrics(
  workItems: readonly AdoWorkItemOptionDto[],
  backlogStates: readonly AdoTaskStateDto[],
): SprintWorkflowSectionMetrics {
  const workflow = buildDashboardWorkflowMetrics([...workItems], [...backlogStates]);

  return {
    pbiProgress: workflow.pbiProgress,
  };
}
