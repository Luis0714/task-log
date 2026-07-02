import { ReportsTimeLogPageShell } from "@/components/reports/time-log/reports-time-log-page-shell";
import { resolvePageCatalog } from "@/lib/ado/resolve-page-catalog";
import type { AdoContextSearchParams } from "@/lib/ado/types";

export type ReportsTimeLogShellServerProps = {
  sp: AdoContextSearchParams;
  defaultProject: string | null;
  adoExecutionReady: boolean;
};

export async function ReportsTimeLogShellServer({
  sp,
  defaultProject,
  adoExecutionReady,
}: ReportsTimeLogShellServerProps) {
  const catalog = await resolvePageCatalog(adoExecutionReady, defaultProject, sp);

  return (
    <ReportsTimeLogPageShell catalog={catalog} adoExecutionReady={adoExecutionReady} />
  );
}
