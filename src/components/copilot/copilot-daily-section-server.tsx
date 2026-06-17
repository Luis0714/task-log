import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DashboardDailySection } from "@/components/dashboard/sections/dashboard-daily-section";
import { loadDailySectionData } from "@/components/dashboard/daily/load-daily-section-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";

export type CopilotDailySectionServerProps = {
  catalog: AdoCatalogSnapshot;
};

export async function CopilotDailySectionServer({
  catalog,
}: Readonly<CopilotDailySectionServerProps>) {
  const result = await loadDailySectionData(catalog);
  if (!result.ok) return <CopilotErrorAlert message={result.error} />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Resumen del daily</CardTitle>
        <CardDescription>
          Texto breve para compartir en tu reunión diaria.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DashboardDailySection
          inProgress={result.data.inProgress}
          sprintName={result.data.sprintName}
        />
      </CardContent>
    </Card>
  );
}