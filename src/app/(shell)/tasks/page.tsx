import Link from "next/link";
import { Plus } from "lucide-react";

import { SprintItemsShellServer } from "@/components/sprint-items/sprint-items-shell-server";
import { SprintItemsListStreamLoader } from "@/components/sprint-items/sprint-items-list-stream-loader";
import { SprintItemsSharedProviders } from "@/components/sprint-items/sprint-items-shared-providers";
import { AdoContextPageLayout } from "@/components/ado/ado-context-page-layout";
import { SprintItemsShellSkeleton } from "@/components/skeletons/sprint-items-shell-skeleton";
import { Button } from "@/components/ui/button";
import { canLoadLiveAdoContent } from "@/lib/auth/auth-ui";
import { resolvePageAuth } from "@/lib/auth/resolve-page-auth";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";
import { DEFAULT_WORK_ITEM_FILTERS } from "@/lib/schemas/work-item-filters";

export const metadata = buildPageMetadata(PAGE_SEO.tasks);

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TasksPage({ searchParams }: PageProps) {
  const { searchParams: sp, auth, defaultProject } = await resolvePageAuth(searchParams);
  const urlAssignee = sp.assignee ?? DEFAULT_WORK_ITEM_FILTERS.assignee;

  const showLiveData = canLoadLiveAdoContent(auth);
  const headerAction = showLiveData ? (
    <Button
      render={<Link href="/time-log?create=1" />}
      nativeButton={false}
      className="shrink-0"
    >
      <Plus data-icon="inline-start" aria-hidden />
      Nueva tarea
    </Button>
  ) : null;

  return (
    <SprintItemsSharedProviders initialAssignee={urlAssignee}>
      <AdoContextPageLayout
        shellFallback={<SprintItemsShellSkeleton />}
        adoExecutionReady={showLiveData}
        connectOptions={auth.connectOptions}
        savedConnectionTarget={auth.savedConnectionTarget}
        shell={
          <SprintItemsShellServer
            kind="tasks"
            sp={sp}
            defaultProject={defaultProject}
            adoExecutionReady={showLiveData}
            headerAction={headerAction}
          />
        }
        content={
          <SprintItemsListStreamLoader
            kind="tasks"
            sp={sp}
            defaultProject={defaultProject}
            adoExecutionReady={showLiveData}
            assignee={urlAssignee}
          />
        }
      />
    </SprintItemsSharedProviders>
  );
}
