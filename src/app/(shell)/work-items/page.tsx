import { Suspense } from "react";

import { WorkItemsFiltersProvider } from "@/components/work-items/work-items-filters-context";
import { WorkItemsShellServer } from "@/components/work-items/work-items-shell-server";
import { WorkItemsStreamLoader } from "@/components/work-items/work-items-stream-loader";
import { AdoContextPageLayout } from "@/components/ado/ado-context-page-layout";
import {
  WorkItemsAllSectionSkeleton,
  WorkItemsDevelopedSectionSkeleton,
  WorkItemsInProgressSectionSkeleton,
  WorkItemsUpcomingSectionSkeleton,
} from "@/components/skeletons/work-items-section-skeletons";
import { WorkItemsShellSkeleton } from "@/components/skeletons/work-items-shell-skeleton";
import { emptyServerProfileFields } from "@/lib/auth/profile-display";
import { resolvePageAuthWithProfile } from "@/lib/auth/resolve-page-auth";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";
import { DEFAULT_WORK_ITEM_FILTERS } from "@/lib/schemas/work-item-filters";

export const metadata = buildPageMetadata(PAGE_SEO.workItems);

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WorkItemsPage({ searchParams }: PageProps) {
  const { searchParams: sp, auth, defaultProject, profile } =
    await resolvePageAuthWithProfile(searchParams);
  const profileFields = auth.adoExecutionReady ? profile : emptyServerProfileFields;
  const urlAssignee = sp.assignee ?? DEFAULT_WORK_ITEM_FILTERS.assignee;

  return (
    <WorkItemsFiltersProvider initialAssignee={urlAssignee}>
      <AdoContextPageLayout
        shellFallback={<WorkItemsShellSkeleton />}
        adoExecutionReady={auth.adoExecutionReady}
        shell={
          <WorkItemsShellServer
            sp={sp}
            defaultProject={defaultProject}
            adoExecutionReady={auth.adoExecutionReady}
          />
        }
        content={
          <Suspense
            fallback={
              <div className="flex flex-col gap-8">
                <WorkItemsAllSectionSkeleton />
                <WorkItemsInProgressSectionSkeleton />
                <WorkItemsUpcomingSectionSkeleton />
                <WorkItemsDevelopedSectionSkeleton />
              </div>
            }
          >
            <WorkItemsStreamLoader
              sp={sp}
              defaultProject={defaultProject}
              adoExecutionReady={auth.adoExecutionReady}
              assignee={urlAssignee}
              currentUserDisplayName={profileFields.profileDisplayName}
            />
          </Suspense>
        }
      />
    </WorkItemsFiltersProvider>
  );
}
