import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintHuCountBadge } from "@/components/dashboard/metrics/sprint-hu-count-badge";
import { SprintDeliverySection } from "@/components/dashboard/sections/sprint-delivery-section";
import {
  firstSprintDataError,
  loadSprintBacklogStates,
  loadSprintBugStates,
  loadSprintPeriodBugs,
  loadSprintPeriodStories,
} from "@/lib/ado/load-sprint-data";
import { catalogToSprintContext } from "@/lib/ado/sprint-data-context";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { buildDashboardDeliveryMetrics } from "@/lib/dashboard/build-dashboard-delivery-metrics";

export type DashboardDeliverySectionServerProps = {
  readonly catalog: AdoCatalogSnapshot;
};

export async function DashboardDeliverySectionServer({
  catalog,
}: DashboardDeliverySectionServerProps) {
  const ctx = catalogToSprintContext(catalog);
  if (!ctx) return null;

  const [workItems, bugs, backlogStates, bugStates] = await Promise.all([
    loadSprintPeriodStories(
      ctx.project,
      ctx.team,
      ctx.sprintPath,
      ctx.sprintStartDate,
      ctx.sprintFinishDate,
      ctx.assignee,
    ),
    loadSprintPeriodBugs(
      ctx.project,
      ctx.team,
      ctx.sprintPath,
      ctx.sprintStartDate,
      ctx.sprintFinishDate,
      ctx.assignee,
    ),
    loadSprintBacklogStates(ctx.project),
    loadSprintBugStates(ctx.project),
  ]);

  const error = firstSprintDataError(workItems, bugs, backlogStates, bugStates);
  if (error) return <CopilotErrorAlert message={error} />;

  const metrics = buildDashboardDeliveryMetrics({
    workItems: workItems.data,
    bugs: bugs.data,
    backlogStates: backlogStates.data,
    bugStates: bugStates.data,
  });
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
