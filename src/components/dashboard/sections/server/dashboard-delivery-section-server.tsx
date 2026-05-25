import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintDeliverySection } from "@/components/dashboard/sections/sprint-delivery-section";
import {
  emptyDashboardBundle,
  buildDashboardSectionMetrics,
} from "@/lib/dashboard/build-dashboard-section-metrics";
import {
  firstSprintDataError,
  loadSprintBacklogStates,
  loadSprintBugs,
  loadSprintWorkItems,
} from "@/lib/ado/load-sprint-data";
import { catalogToSprintContext } from "@/lib/ado/sprint-data-context";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";

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

  const { metrics } = buildDashboardSectionMetrics({
    bundle: emptyDashboardBundle({
      workItems: workItems.data,
      bugs: bugs.data,
      backlogStates: backlogStates.data,
    }),
    catalog,
    sprintDayKey,
  });

  return (
    <DashboardSection title="Entrega del sprint">
      <SprintDeliverySection metrics={metrics} />
    </DashboardSection>
  );
}
