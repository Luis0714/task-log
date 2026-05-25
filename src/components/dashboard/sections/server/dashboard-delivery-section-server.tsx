import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintDeliverySection } from "@/components/dashboard/sections/sprint-delivery-section";
import {
  firstSprintDataError,
  loadSprintBacklogStates,
  loadSprintBugs,
  loadSprintWorkItems,
} from "@/lib/ado/load-sprint-data";
import { catalogToSprintContext } from "@/lib/ado/sprint-data-context";
import type { AdoCatalogSnapshot, DashboardSprintBundle } from "@/lib/ado/types";
import { buildDashboardMetrics } from "@/lib/dashboard/build-dashboard-metrics";

export type DashboardDeliverySectionServerProps = {
  catalog: AdoCatalogSnapshot;
  sprintDayKey: string;
};

export async function DashboardDeliverySectionServer({
  catalog,
  sprintDayKey,
}: DashboardDeliverySectionServerProps) {
  const ctx = catalogToSprintContext(catalog);
  if (!ctx) return null;

  const [workItems, bugs, backlogStates] = await Promise.all([
    loadSprintWorkItems(ctx),
    loadSprintBugs(ctx),
    loadSprintBacklogStates(ctx.project),
  ]);

  const error = firstSprintDataError(workItems, bugs, backlogStates);
  if (error) return <CopilotErrorAlert message={error} />;

  const bundle: DashboardSprintBundle = {
    workItems: workItems.data,
    bugs: bugs.data,
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
    <DashboardSection title="Entrega del sprint">
      <SprintDeliverySection metrics={metrics} />
    </DashboardSection>
  );
}
