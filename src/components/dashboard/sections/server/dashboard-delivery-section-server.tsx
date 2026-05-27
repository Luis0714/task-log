import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintHuCountBadge } from "@/components/dashboard/metrics/sprint-hu-count-badge";
import { SprintDeliverySection } from "@/components/dashboard/sections/sprint-delivery-section";
import {
  firstSprintDataError,
  loadSprintBacklogStates,
  loadSprintBugs,
  loadSprintWorkItems,
} from "@/lib/ado/load-sprint-data";
import { catalogToSprintContext } from "@/lib/ado/sprint-data-context";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { buildDashboardDeliveryMetrics } from "@/lib/dashboard/build-dashboard-delivery-metrics";

export type DashboardDeliverySectionServerProps = {
  catalog: AdoCatalogSnapshot;
  sprintDayKey: string;
};

export async function DashboardDeliverySectionServer({
  catalog,
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

  const metrics = buildDashboardDeliveryMetrics(workItems.data, bugs.data);
  const huCount = metrics.sprintStatusOverview.userStories.assigned;

  return (
    <DashboardSection
      title="Entrega del sprint"
      action={<SprintHuCountBadge count={huCount} />}
    >
      <SprintDeliverySection metrics={metrics} />
    </DashboardSection>
  );
}
