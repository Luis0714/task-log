import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { DashboardDailySection } from "@/components/dashboard/sections/dashboard-daily-section";
import { loadDailySectionData } from "@/components/dashboard/daily/load-daily-section-data";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";

export type DashboardDailySectionServerProps = {
  catalog: AdoCatalogSnapshot;
};

export async function DashboardDailySectionServer({
  catalog,
}: Readonly<DashboardDailySectionServerProps>) {
  const result = await loadDailySectionData(catalog);
  if (!result.ok) return <CopilotErrorAlert message={result.error} />;

  return (
    <DashboardSection
      title="Resumen del daily"
      description="Texto breve para compartir en tu reunión diaria."
    >
      <DashboardDailySection
        inProgress={result.data.inProgress}
        sprintName={result.data.sprintName}
      />
    </DashboardSection>
  );
}
