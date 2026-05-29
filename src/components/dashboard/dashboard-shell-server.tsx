import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import { loadNonWorkingDates } from "@/lib/ado/load-non-working-dates";
import { resolvePageCatalog } from "@/lib/ado/resolve-page-catalog";
import type { AdoContextSearchParams } from "@/lib/ado/types";
import type { ConnectAuthOptions } from "@/lib/auth/auth-method";
import type { DashboardHeaderData } from "@/lib/dashboard/types";

export type DashboardShellServerProps = {
  sp: AdoContextSearchParams;
  defaultProject: string | null;
  userSessionActive: boolean;
  adoExecutionReady: boolean;
  connectOptions: ConnectAuthOptions;
  header: DashboardHeaderData;
  initialSprintDayKey: string;
};

export async function DashboardShellServer({
  sp,
  defaultProject,
  userSessionActive,
  adoExecutionReady,
  connectOptions,
  header,
  initialSprintDayKey,
}: DashboardShellServerProps) {
  const canLoadCatalog = userSessionActive && adoExecutionReady;
  const catalog = await resolvePageCatalog(canLoadCatalog, defaultProject, sp);

  const nonWorkingDates =
    canLoadCatalog && catalog.project && catalog.team
      ? await loadNonWorkingDates(catalog.project, catalog.team)
      : [];

  return (
    <DashboardPageShell
      header={header}
      catalog={catalog}
      adoExecutionReady={canLoadCatalog}
      userSessionActive={userSessionActive}
      connectOptions={connectOptions}
      initialSprintDayKey={initialSprintDayKey}
      nonWorkingDates={nonWorkingDates}
    />
  );
}
