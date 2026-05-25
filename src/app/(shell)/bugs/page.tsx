import { Suspense } from "react";

import { SprintItemsPageShell } from "@/components/sprint-items/sprint-items-page-shell";
import { SprintItemsListsServer } from "@/components/sprint-items/sprint-items-lists-server";
import { SprintItemsListSkeleton } from "@/components/skeletons/sprint-items-list-skeleton";
import { loadAdoCatalog } from "@/lib/ado/load-ado-catalog";
import { loadNonWorkingDates } from "@/lib/ado/load-non-working-dates";
import { parseAdoContextSearchParams } from "@/lib/ado/parse-context-search-params";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";
import { loadSprintItemsFilterMeta } from "@/lib/sprint-items/load-sprint-items-filter-meta";
import { DEFAULT_WORK_ITEM_FILTERS } from "@/lib/schemas/work-item-filters";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BugsPage({ searchParams }: PageProps) {
  const sp = parseAdoContextSearchParams(await searchParams);
  const auth = await getServerAuthBootstrap();
  const defaultProject =
    auth.authMethod === "pat" ? auth.patProject : auth.defaultProject;
  const urlAssignee = sp.assignee ?? DEFAULT_WORK_ITEM_FILTERS.assignee;

  const emptyCatalog = await loadAdoCatalog(null, {});
  const catalog = auth.adoExecutionReady
    ? await loadAdoCatalog(defaultProject, sp)
    : emptyCatalog;

  const filterMeta =
    auth.adoExecutionReady && catalog.project && catalog.team
      ? await loadSprintItemsFilterMeta("bugs", catalog.project, catalog.team)
      : { members: [], states: [] };

  const nonWorkingDates =
    auth.adoExecutionReady && catalog.project && catalog.team
      ? await loadNonWorkingDates(catalog.project, catalog.team)
      : [];

  const suspenseKey = [
    catalog.project,
    catalog.team,
    catalog.sprintPath,
    urlAssignee,
  ].join("|");

  return (
    <SprintItemsPageShell
      kind="bugs"
      catalog={catalog}
      filterMeta={filterMeta}
      nonWorkingDates={nonWorkingDates}
      adoExecutionReady={auth.adoExecutionReady}
      urlAssignee={urlAssignee}
    >
      {auth.adoExecutionReady && catalog.sprintPath ? (
        <Suspense key={suspenseKey} fallback={<SprintItemsListSkeleton />}>
          <SprintItemsListsServer kind="bugs" catalog={catalog} assignee={urlAssignee} />
        </Suspense>
      ) : null}
    </SprintItemsPageShell>
  );
}
