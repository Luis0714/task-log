import { SprintsPageShell } from "@/components/sprints/sprints-page-shell";
import { resolvePageCatalog } from "@/lib/ado/resolve-page-catalog";
import type { AdoContextSearchParams } from "@/lib/ado/types";

export type SprintsShellServerProps = {
  sp: AdoContextSearchParams;
  defaultProject: string | null;
  adoExecutionReady: boolean;
};

export async function SprintsShellServer({
  sp,
  defaultProject,
  adoExecutionReady,
}: SprintsShellServerProps) {
  const catalog = await resolvePageCatalog(adoExecutionReady, defaultProject, sp);

  return (
    <SprintsPageShell catalog={catalog} adoExecutionReady={adoExecutionReady} />
  );
}
