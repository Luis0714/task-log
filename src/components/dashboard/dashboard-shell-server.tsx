import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import { loadAdoCatalog } from "@/lib/ado/load-ado-catalog";
import { loadNonWorkingDates } from "@/lib/ado/load-non-working-dates";
import type { AdoContextSearchParams } from "@/lib/ado/types";
import type { DashboardHeaderData } from "@/lib/dashboard/types";

export type DashboardShellServerProps = {
  sp: AdoContextSearchParams;
  defaultProject: string | null;
  adoExecutionReady: boolean;
  header: DashboardHeaderData;
  initialSprintDayKey: string;
};

export async function DashboardShellServer({
  sp,
  defaultProject,
  adoExecutionReady,
  header,
  initialSprintDayKey,
}: DashboardShellServerProps) {
  const emptyCatalog = await loadAdoCatalog(null, {});
  const catalog = adoExecutionReady
    ? await loadAdoCatalog(defaultProject, sp)
    : emptyCatalog;

  const nonWorkingDates =
    adoExecutionReady && catalog.project && catalog.team
      ? await loadNonWorkingDates(catalog.project, catalog.team)
      : [];

  return (
    <DashboardPageShell
      header={header}
      catalog={catalog}
      adoExecutionReady={adoExecutionReady}
      initialSprintDayKey={initialSprintDayKey}
      nonWorkingDates={nonWorkingDates}
    />
  );
}
