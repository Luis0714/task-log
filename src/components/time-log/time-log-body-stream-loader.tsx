import { TimeLogBodyServer } from "@/components/time-log/time-log-body-server";
import { resolvePageCatalog } from "@/lib/ado/resolve-page-catalog";
import { loadTimeLogFormMeta } from "@/lib/time-log/load-time-log-form-meta";
import type { AdoContextSearchParams } from "@/lib/ado/types";
import type { AzdoAuthMethod } from "@/lib/auth/auth-method";

export type TimeLogBodyStreamLoaderProps = {
  sp: AdoContextSearchParams;
  defaultProject: string | null;
  adoExecutionReady: boolean;
  authMethod: AzdoAuthMethod;
  urlAssignee: string;
};

export async function TimeLogBodyStreamLoader({
  sp,
  defaultProject,
  adoExecutionReady,
  authMethod,
  urlAssignee,
}: TimeLogBodyStreamLoaderProps) {
  const catalog = await resolvePageCatalog(adoExecutionReady, defaultProject, sp);
  if (!catalog.sprintPath) return null;

  const formMeta = await loadTimeLogFormMeta(catalog);
  const serverBaseline = { catalog, ...formMeta };

  return (
    <TimeLogBodyServer
      adoExecutionReady={adoExecutionReady}
      authMethod={authMethod}
      defaultProject={defaultProject}
      serverBaseline={serverBaseline}
      urlAssignee={urlAssignee}
    />
  );
}
