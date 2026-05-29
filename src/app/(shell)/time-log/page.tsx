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
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";
import { DEFAULT_WORK_ITEM_FILTERS } from "@/lib/schemas/work-item-filters";

export const metadata = buildPageMetadata(PAGE_SEO.timeLog);

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TimeLogPage({ searchParams }: PageProps) {
  const { searchParams: sp, auth, defaultProject } = await resolvePageAuth(searchParams);
  const urlAssignee = sp.assignee ?? DEFAULT_WORK_ITEM_FILTERS.assignee;
  const showLiveData = canLoadLiveAdoContent(auth);

  if (!showLiveData) {
    return (
      <AuthRequiredPageLayout
        title={PAGE_SEO.timeLog.title}
        description={PAGE_SEO.timeLog.description}
        connectOptions={auth.connectOptions}
      />
    );
  }

  return (
    <TimeLogPageLayout className="flex min-h-0 flex-1 flex-col">
      <AdoContextPageLayout
        className="min-h-0 min-w-0 flex-1"
        gapClassName="gap-5"
        shellFallback={<TimeLogShellSkeleton />}
        adoExecutionReady={showLiveData}
        connectOptions={auth.connectOptions}
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
              adoExecutionReady={auth.adoExecutionReady}
              urlAssignee={urlAssignee}
            />
          </Suspense>
        }
      />
    </TimeLogPageLayout>
  );
}
