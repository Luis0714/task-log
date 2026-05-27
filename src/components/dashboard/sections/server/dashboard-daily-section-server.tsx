import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { DashboardDailySection } from "@/components/dashboard/sections/dashboard-daily-section";
import { firstSprintDataError, loadSprintWorkItems } from "@/lib/ado/load-sprint-data";
import { catalogToSprintContext } from "@/lib/ado/sprint-data-context";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import {
  mapToDashboardWorkItems,
  selectInProgressItems,
} from "@/lib/dashboard/work-item-selectors";
import { resolveCurrentSprint } from "@/lib/dashboard/build-dashboard-metrics";

export type DashboardDailySectionServerProps = {
  catalog: AdoCatalogSnapshot;
};

export async function DashboardDailySectionServer({
  catalog,
}: DashboardDailySectionServerProps) {
  const ctx = catalogToSprintContext(catalog);
  if (!ctx) return null;

  const workItems = await loadSprintWorkItems(ctx.project, ctx.sprintPath, ctx.assignee);
  const error = firstSprintDataError(workItems);
  if (error) return <CopilotErrorAlert message={error} />;

  const inProgress = selectInProgressItems(mapToDashboardWorkItems(workItems.data));
  const currentSprint = resolveCurrentSprint(catalog);

  return (
    <DashboardSection
      title="Resumen del daily"
      description="Texto breve para compartir en tu reunión diaria."
    >
      <DashboardDailySection
        inProgress={inProgress}
        sprintName={currentSprint?.name ?? "Sprint actual"}
      />
    </DashboardSection>
  );
}
