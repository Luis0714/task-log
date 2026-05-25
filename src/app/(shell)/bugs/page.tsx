import { SprintItemsShellServer } from "@/components/sprint-items/sprint-items-shell-server";
import { SprintItemsListStreamLoader } from "@/components/sprint-items/sprint-items-list-stream-loader";
import { AdoContextPageLayout } from "@/components/ado/ado-context-page-layout";
import { SprintItemsShellSkeleton } from "@/components/skeletons/sprint-items-shell-skeleton";
import { resolvePageAuth } from "@/lib/auth/resolve-page-auth";
import { DEFAULT_WORK_ITEM_FILTERS } from "@/lib/schemas/work-item-filters";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BugsPage({ searchParams }: PageProps) {
  const { searchParams: sp, auth, defaultProject } = await resolvePageAuth(searchParams);
  const urlAssignee = sp.assignee ?? DEFAULT_WORK_ITEM_FILTERS.assignee;

  return (
    <AdoContextPageLayout
      shellFallback={<SprintItemsShellSkeleton />}
      adoExecutionReady={auth.adoExecutionReady}
      shell={
        <SprintItemsShellServer
          kind="bugs"
          sp={sp}
          defaultProject={defaultProject}
          adoExecutionReady={auth.adoExecutionReady}
          urlAssignee={urlAssignee}
        />
      }
      content={
        <SprintItemsListStreamLoader
          kind="bugs"
          sp={sp}
          defaultProject={defaultProject}
          adoExecutionReady={auth.adoExecutionReady}
          assignee={urlAssignee}
        />
      }
    />
  );
}
