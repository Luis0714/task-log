import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintWorkflowSection } from "@/components/dashboard/sections/sprint-workflow-section";
import {
  firstSprintDataError,
  loadSprintBacklogStates,
  loadSprintWorkItems,
} from "@/lib/ado/load-sprint-data";
import { catalogToSprintContext } from "@/lib/ado/sprint-data-context";
import type { AdoCatalogSnapshot, DashboardSprintBundle } from "@/lib/ado/types";
import { buildDashboardMetrics } from "@/lib/dashboard/build-dashboard-metrics";

export type DashboardWorkflowSectionServerProps = {
  catalog: AdoCatalogSnapshot;
  sprintDayKey: string;
};

export async function DashboardWorkflowSectionServer({
  catalog,
  sprintDayKey,
}: DashboardWorkflowSectionServerProps) {
  const ctx = catalogToSprintContext(catalog);
  if (!ctx) return null;

  const [workItems, backlogStates] = await Promise.all([
    loadSprintWorkItems(ctx),
    loadSprintBacklogStates(ctx.project),
  ]);

  const error = firstSprintDataError(workItems, backlogStates);
  if (error) return <CopilotErrorAlert message={error} />;

  const bundle: DashboardSprintBundle = {
    workItems: workItems.data,
    bugs: [],
    tasks: [],
    backlogStates: backlogStates.data,
    nonWorkingDates: [],
    error: null,
  };

  const { metrics } = buildDashboardMetrics({
    bundle,
    catalog,
    selectedSprintDayKey: sprintDayKey,
  });

  return (
    <DashboardSection title="Trabajo por estado">
      <SprintWorkflowSection metrics={metrics} />
    </DashboardSection>
  );
}
