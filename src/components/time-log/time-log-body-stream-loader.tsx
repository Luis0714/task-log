import { TimeLogBodyServer } from "@/components/time-log/time-log-body-server";
import { resolvePageCatalog } from "@/lib/ado/resolve-page-catalog";
import { loadTimeLogFormMeta } from "@/lib/time-log/load-time-log-form-meta";
import type { AdoContextSearchParams } from "@/lib/ado/types";
export type TimeLogBodyStreamLoaderProps = {
  sp: AdoContextSearchParams;
  defaultProject: string | null;
  adoExecutionReady: boolean;
  urlAssignee: string;
};

export async function TimeLogBodyStreamLoader({
  sp,
  defaultProject,
  adoExecutionReady,
  urlAssignee,
}: TimeLogBodyStreamLoaderProps) {
  const catalog = await resolvePageCatalog(adoExecutionReady, defaultProject, sp);
  if (!catalog.sprintPath) return null;

  const formMeta = await loadTimeLogFormMeta(catalog);
  const serverBaseline = { catalog, ...formMeta };

  return (
    <TimeLogBodyServer
      adoExecutionReady={adoExecutionReady}
      defaultProject={defaultProject}
      serverBaseline={serverBaseline}
      urlAssignee={urlAssignee}
    />
  );
}
