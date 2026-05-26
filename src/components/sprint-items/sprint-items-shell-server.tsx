import { SprintItemsPageShell } from "@/components/sprint-items/sprint-items-page-shell";
import { resolvePageCatalog } from "@/lib/ado/resolve-page-catalog";
import type { AdoContextSearchParams } from "@/lib/ado/types";
import { loadSprintItemsPageMeta } from "@/lib/sprint-items/load-sprint-items-page-meta";
import type { SprintItemsKind } from "@/lib/sprint-items/types";
import type { ReactNode } from "react";

export type SprintItemsShellServerProps = {
  kind: SprintItemsKind;
  sp: AdoContextSearchParams;
  defaultProject: string | null;
  adoExecutionReady: boolean;
  headerAction?: ReactNode;
};

export async function SprintItemsShellServer({
  kind,
  sp,
  defaultProject,
  adoExecutionReady,
  headerAction,
}: SprintItemsShellServerProps) {
  const catalog = await resolvePageCatalog(adoExecutionReady, defaultProject, sp);

  const pageMeta =
    adoExecutionReady && catalog.project && catalog.team
      ? await loadSprintItemsPageMeta(kind, catalog)
      : { filterMeta: { members: [], states: [] }, nonWorkingDates: [] };

  return (
    <SprintItemsPageShell
      kind={kind}
      catalog={catalog}
      filterMeta={pageMeta.filterMeta}
      nonWorkingDates={pageMeta.nonWorkingDates}
      adoExecutionReady={adoExecutionReady}
      headerAction={headerAction}
    />
  );
}
