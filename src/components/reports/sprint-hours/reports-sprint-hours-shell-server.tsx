import { ReportsSprintHoursPageShell } from "@/components/reports/sprint-hours/reports-sprint-hours-page-shell";
import { resolvePageCatalog } from "@/lib/ado/resolve-page-catalog";
import type { AdoContextSearchParams } from "@/lib/ado/types";

export type ReportsSprintHoursShellServerProps = {
  sp: AdoContextSearchParams;
  defaultProject: string | null;
  adoExecutionReady: boolean;
};

export async function ReportsSprintHoursShellServer({
  sp,
  defaultProject,
  adoExecutionReady,
}: ReportsSprintHoursShellServerProps) {
  const catalog = await resolvePageCatalog(adoExecutionReady, defaultProject, sp);

  return (
    <ReportsSprintHoursPageShell
      catalog={catalog}
      adoExecutionReady={adoExecutionReady}
    />
  );
}
