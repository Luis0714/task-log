import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintWorkflowSection } from "@/components/dashboard/sections/sprint-workflow-section";
import {
  firstSprintDataError,
  loadSprintBacklogStates,
  loadSprintPeriodStories,
} from "@/lib/ado/load-sprint-data";
import { catalogToSprintContext } from "@/lib/ado/sprint-data-context";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { buildSprintWorkflowSectionMetrics } from "@/lib/sprints/build-sprint-workflow-section-metrics";

export type DashboardWorkflowSectionServerProps = {
  readonly catalog: AdoCatalogSnapshot;
};

export async function DashboardWorkflowSectionServer({
  catalog,
}: DashboardWorkflowSectionServerProps) {
  const ctx = catalogToSprintContext(catalog);
  if (!ctx) return null;

  const [workItems, backlogStates] = await Promise.all([
    loadSprintPeriodStories(
      ctx.project,
      ctx.team,
      ctx.sprintPath,
      ctx.sprintStartDate,
      ctx.sprintFinishDate,
      ctx.assignee,
    ),
    loadSprintBacklogStates(ctx.project),
  ]);

  const error = firstSprintDataError(workItems, backlogStates);
  if (error) return <CopilotErrorAlert message={error} />;

  const metrics = buildSprintWorkflowSectionMetrics(workItems.data, backlogStates.data);

  return (
    <DashboardSection title="Trabajo por estado">
      <SprintWorkflowSection metrics={metrics} />
    </DashboardSection>
  );
}
