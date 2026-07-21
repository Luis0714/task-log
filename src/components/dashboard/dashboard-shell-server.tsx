import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import { loadSprintHolidayDates } from "@/lib/ado/load-sprint-data";
import { resolveCurrentSprint } from "@/lib/ado/resolve-current-sprint";
import { resolvePageCatalog } from "@/lib/ado/resolve-page-catalog";
import type { AdoContextSearchParams } from "@/lib/ado/types";
import type { ConnectAuthOptions } from "@/lib/auth/auth-method";
import type { SavedConnectionTarget } from "@/lib/auth/server-state";
import type { DashboardHeaderData } from "@/lib/dashboard/types";

export type DashboardShellServerProps = {
  readonly sp: AdoContextSearchParams;
  readonly defaultProject: string | null;
  readonly userSessionActive: boolean;
  readonly adoExecutionReady: boolean;
  readonly connectOptions: ConnectAuthOptions;
  readonly savedConnectionTarget: SavedConnectionTarget | null;
  readonly header: DashboardHeaderData;
  readonly initialSprintDayKey: string;
};

export async function DashboardShellServer({
  sp,
  defaultProject,
  userSessionActive,
  adoExecutionReady,
  connectOptions,
  savedConnectionTarget,
  header,
  initialSprintDayKey,
}: DashboardShellServerProps) {
  const canLoadCatalog = userSessionActive && adoExecutionReady;
  const catalog = await resolvePageCatalog(canLoadCatalog, defaultProject, sp);

  const currentSprint = resolveCurrentSprint(catalog);
  const nonWorkingDates = canLoadCatalog
    ? (
        await loadSprintHolidayDates(
          currentSprint?.startDate ?? null,
          currentSprint?.finishDate ?? null,
        )
      ).data
    : [];

  return (
    <DashboardPageShell
      header={header}
      catalog={catalog}
      adoExecutionReady={canLoadCatalog}
      userSessionActive={userSessionActive}
      connectOptions={connectOptions}
      savedConnectionTarget={savedConnectionTarget}
      initialSprintDayKey={initialSprintDayKey}
      nonWorkingDates={nonWorkingDates}
    />
  );
}
