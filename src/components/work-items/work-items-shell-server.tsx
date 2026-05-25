import { WorkItemsPageShell } from "@/components/work-items/work-items-page-shell";
import { loadAdoCatalog } from "@/lib/ado/load-ado-catalog";
import type { AdoContextSearchParams } from "@/lib/ado/types";
import { loadWorkItemsFilterMeta } from "@/lib/work-items/load-work-items-filter-meta";

export type WorkItemsShellServerProps = {
  sp: AdoContextSearchParams;
  defaultProject: string | null;
  adoExecutionReady: boolean;
  urlAssignee: string;
  currentUserDisplayName?: string | null;
};

export async function WorkItemsShellServer({
  sp,
  defaultProject,
  adoExecutionReady,
  urlAssignee,
  currentUserDisplayName = null,
}: WorkItemsShellServerProps) {
  const emptyCatalog = await loadAdoCatalog(null, {});
  const catalog = adoExecutionReady
    ? await loadAdoCatalog(defaultProject, sp)
    : emptyCatalog;

  const filterMeta =
    adoExecutionReady && catalog.project && catalog.team
      ? await loadWorkItemsFilterMeta(catalog.project, catalog.team)
      : { members: [], states: [] };

  return (
    <WorkItemsPageShell
      catalog={catalog}
      filterMeta={filterMeta}
      adoExecutionReady={adoExecutionReady}
      urlAssignee={urlAssignee}
      currentUserDisplayName={currentUserDisplayName}
    />
  );
}
