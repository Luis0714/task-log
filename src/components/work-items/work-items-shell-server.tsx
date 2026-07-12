import { WorkItemsPageShell } from "@/components/work-items/work-items-page-shell";
import { resolvePageCatalog } from "@/lib/ado/resolve-page-catalog";
import type { AdoContextSearchParams } from "@/lib/ado/types";
import { loadWorkItemsFilterMeta } from "@/lib/work-items/load-work-items-filter-meta";

export type WorkItemsShellServerProps = {
  sp: AdoContextSearchParams;
  defaultProject: string | null;
  adoExecutionReady: boolean;
};

export async function WorkItemsShellServer({
  sp,
  defaultProject,
  adoExecutionReady,
}: WorkItemsShellServerProps) {
  const catalog = await resolvePageCatalog(adoExecutionReady, defaultProject, sp);

  const filterMeta =
    adoExecutionReady && catalog.project && catalog.team
      ? await loadWorkItemsFilterMeta(
          catalog.project,
          catalog.team,
        )
      : { members: [], states: [] };

  return (
    <WorkItemsPageShell
      catalog={catalog}
      filterMeta={filterMeta}
      adoExecutionReady={adoExecutionReady}
    />
  );
}
