import { Suspense } from "react";

import { SprintItemsShellServer } from "@/components/sprint-items/sprint-items-shell-server";
import { SprintItemsListStreamLoader } from "@/components/sprint-items/sprint-items-list-stream-loader";
import { SprintItemsShellSkeleton } from "@/components/skeletons/sprint-items-shell-skeleton";
import { parseAdoContextSearchParams } from "@/lib/ado/parse-context-search-params";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";
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

  return (
    <div className="flex w-full flex-col gap-8 pb-6">
      <Suspense fallback={<SprintItemsShellSkeleton />}>
        <SprintItemsShellServer
          kind="bugs"
          sp={sp}
          defaultProject={defaultProject}
          adoExecutionReady={auth.adoExecutionReady}
          urlAssignee={urlAssignee}
        />
      </Suspense>

      {auth.adoExecutionReady ? (
        <SprintItemsListStreamLoader
          kind="bugs"
          sp={sp}
          defaultProject={defaultProject}
          assignee={urlAssignee}
        />
      ) : null}
    </div>
  );
}
