import { Suspense } from "react";

import { WorkItemsShellServer } from "@/components/work-items/work-items-shell-server";
import { WorkItemsStreamLoader } from "@/components/work-items/work-items-stream-loader";
import {
  WorkItemsAllSectionSkeleton,
  WorkItemsDevelopedSectionSkeleton,
  WorkItemsInProgressSectionSkeleton,
  WorkItemsUpcomingSectionSkeleton,
} from "@/components/skeletons/work-items-section-skeletons";
import { WorkItemsShellSkeleton } from "@/components/skeletons/work-items-shell-skeleton";
import { parseAdoContextSearchParams } from "@/lib/ado/parse-context-search-params";
import { emptyServerProfileFields } from "@/lib/auth/profile-display";
import { getServerAuthBootstrap, getServerAuthProfile } from "@/lib/auth/server-state";
import { DEFAULT_WORK_ITEM_FILTERS } from "@/lib/schemas/work-item-filters";

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

  return (
    <div className="flex w-full flex-col gap-8 pb-6">
      <Suspense fallback={<WorkItemsShellSkeleton />}>
        <WorkItemsShellServer
          sp={sp}
          defaultProject={defaultProject}
          adoExecutionReady={auth.adoExecutionReady}
          urlAssignee={urlAssignee}
          currentUserDisplayName={profileFields.profileDisplayName}
        />
      </Suspense>

      {auth.adoExecutionReady ? (
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
            assignee={urlAssignee}
            currentUserDisplayName={profileFields.profileDisplayName}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
