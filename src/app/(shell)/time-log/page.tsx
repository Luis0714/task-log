import { Suspense } from "react";

import { TimeLogBodyStreamLoader } from "@/components/time-log/time-log-body-stream-loader";
import { TimeLogPageLayout } from "@/components/time-log/time-log-page-layout";
import { TimeLogShellServer } from "@/components/time-log/time-log-shell-server";
import { AdoContextPageLayout } from "@/components/ado/ado-context-page-layout";
import { TimeLogFormSkeleton } from "@/components/skeletons/time-log-form-skeleton";
import { TimeLogShellSkeleton } from "@/components/skeletons/time-log-shell-skeleton";
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

  return (
    <TimeLogPageLayout>
      <AdoContextPageLayout
        className="min-w-0"
        gapClassName="gap-5"
        shellFallback={<TimeLogShellSkeleton />}
        adoExecutionReady={auth.adoExecutionReady}
        shell={
          <TimeLogShellServer
            sp={sp}
            defaultProject={defaultProject}
            adoExecutionReady={auth.adoExecutionReady}
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
