import { Suspense } from "react";

import { WorkItemsListsSectionsSkeleton } from "@/components/skeletons/work-items-lists-sections-skeleton";
import { WorkItemsListsServer } from "@/components/work-items/work-items-lists-server";
import { WorkItemsPageShell } from "@/components/work-items/work-items-page-shell";
import { loadAdoCatalog } from "@/lib/ado/load-ado-catalog";
import { parseAdoContextSearchParams } from "@/lib/ado/parse-context-search-params";
import { emptyServerProfileFields } from "@/lib/auth/profile-display";
import { getServerAuthBootstrap, getServerAuthProfile } from "@/lib/auth/server-state";
import { loadWorkItemsFilterMeta } from "@/lib/work-items/load-work-items-filter-meta";
import {
  DEFAULT_WORK_ITEM_FILTERS,
} from "@/lib/schemas/work-item-filters";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WorkItemsPage({ searchParams }: PageProps) {
  const sp = parseAdoContextSearchParams(await searchParams);
  const [auth, profile] = await Promise.all([
    getServerAuthBootstrap(),
    getServerAuthProfile(),
  ]);
  const profileFields = auth.adoExecutionReady ? profile : emptyServerProfileFields;
  const defaultProject =
    auth.authMethod === "pat" ? auth.patProject : auth.defaultProject;
  const urlAssignee = sp.assignee ?? DEFAULT_WORK_ITEM_FILTERS.assignee;

  const emptyCatalog = await loadAdoCatalog(null, {});
  const catalog = auth.adoExecutionReady
    ? await loadAdoCatalog(defaultProject, sp)
    : emptyCatalog;

  const filterMeta =
    auth.adoExecutionReady && catalog.project && catalog.team
      ? await loadWorkItemsFilterMeta(catalog.project, catalog.team)
      : { members: [], states: [] };

  const suspenseKey = [
    catalog.project,
    catalog.team,
    catalog.sprintPath,
    urlAssignee,
  ].join("|");

  return (
    <WorkItemsPageShell
      catalog={catalog}
      filterMeta={filterMeta}
      adoExecutionReady={auth.adoExecutionReady}
      urlAssignee={urlAssignee}
      currentUserDisplayName={profileFields.profileDisplayName}
    >
      {auth.adoExecutionReady && catalog.sprintPath ? (
        <Suspense key={suspenseKey} fallback={<WorkItemsListsSectionsSkeleton />}>
          <WorkItemsListsServer
            catalog={catalog}
            assignee={urlAssignee}
            currentUserDisplayName={profileFields.profileDisplayName}
          />
        </Suspense>
      ) : null}
    </WorkItemsPageShell>
  );
}
