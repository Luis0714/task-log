import { Suspense } from "react";

import { AuthRequiredPageLayout } from "@/components/auth/auth-required-page-layout";
import { TimeLogBodyStreamLoader } from "@/components/time-log/time-log-body-stream-loader";
import { TimeLogPageLayout } from "@/components/time-log/time-log-page-layout";
import { TimeLogShellServer } from "@/components/time-log/time-log-shell-server";
import { AdoContextPageLayout } from "@/components/ado/ado-context-page-layout";
import { TimeLogFormSkeleton } from "@/components/skeletons/time-log-form-skeleton";
import { TimeLogShellSkeleton } from "@/components/skeletons/time-log-shell-skeleton";
import { canLoadLiveAdoContent } from "@/lib/auth/auth-ui";
import { resolvePageAuth } from "@/lib/auth/resolve-page-auth";
import { resolveFilterDefaults } from "@/services/user/resolve-filter-defaults";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";
import {
  WORK_ITEM_ASSIGNEE_ALL,
  type WorkItemFilters,
} from "@/lib/schemas/work-item-filters";
import { USER_FILTER_SCOPES } from "@/lib/filters/user-filter-scopes";

export const metadata = buildPageMetadata(PAGE_SEO.timeLog);

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TimeLogPage({ searchParams }: PageProps) {
  const { searchParams: sp, auth, defaultProject } = await resolvePageAuth(searchParams);
  const rawSearchParams = await searchParams;
  const rawCreate = rawSearchParams.create;
  const createFlag = Array.isArray(rawCreate) ? rawCreate[0] : rawCreate;
  const isTaskCreationMode = createFlag === "1";
  const urlAssignee = sp.assignee ?? WORK_ITEM_ASSIGNEE_ALL;
  const showLiveData = canLoadLiveAdoContent(auth);

  if (!showLiveData) {
    return (
      <AuthRequiredPageLayout
        title={PAGE_SEO.timeLog.title}
        description={PAGE_SEO.timeLog.description}
        connectOptions={auth.connectOptions}
        savedConnectionTarget={auth.savedConnectionTarget}
      />
    );
  }

  const { filters: savedFilters } = await resolveFilterDefaults(USER_FILTER_SCOPES.timeLog);

  const initialWorkItemFilters: Partial<WorkItemFilters> = {
    ...savedFilters,
    assignee: urlAssignee,
  };

  return (
    <TimeLogPageLayout className="flex min-h-0 flex-1 flex-col">
      <AdoContextPageLayout
        className="min-h-0 min-w-0 flex-1"
        gapClassName="gap-5"
        shellFallback={<TimeLogShellSkeleton />}
        adoExecutionReady={showLiveData}
        connectOptions={auth.connectOptions}
        savedConnectionTarget={auth.savedConnectionTarget}
        shell={
          <TimeLogShellServer
            sp={sp}
            defaultProject={defaultProject}
            adoExecutionReady={showLiveData}
          />
        }
        content={
          <Suspense fallback={<TimeLogFormSkeleton />}>
            <TimeLogBodyStreamLoader
              sp={sp}
              defaultProject={defaultProject}
              adoExecutionReady={showLiveData}
              urlAssignee={urlAssignee}
              isTaskCreationMode={isTaskCreationMode}
              initialWorkItemFilters={initialWorkItemFilters}
            />
          </Suspense>
        }
      />
    </TimeLogPageLayout>
  );
}
