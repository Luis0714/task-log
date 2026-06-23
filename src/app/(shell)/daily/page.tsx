import { Suspense } from "react";

import { AdoCatalogGate } from "@/components/ado/ado-catalog-gate";
import { AuthRequiredPageLayout } from "@/components/auth/auth-required-page-layout";
import { DailySummarySkeleton } from "@/components/daily/daily-summary-skeleton";
import { DailySummaryView } from "@/components/daily/daily-summary-view";
import { DailySummaryServer } from "@/components/daily/daily-summary-server";
import { canLoadLiveAdoContent } from "@/lib/auth/auth-ui";
import { resolvePageAuth } from "@/lib/auth/resolve-page-auth";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.daily);

export const dynamic = "force-dynamic";

type PageProps = {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DailyPage({ searchParams }: PageProps) {
  const { searchParams: sp, auth, defaultProject } =
    await resolvePageAuth(searchParams);

  if (!canLoadLiveAdoContent(auth)) {
    return (
      <AuthRequiredPageLayout
        title={PAGE_SEO.daily.title}
        description={PAGE_SEO.daily.description}
        connectOptions={auth.connectOptions}
        savedConnectionTarget={auth.savedConnectionTarget}
      />
    );
  }

  return (
    <Suspense fallback={<DailySummarySkeleton />}>
      <AdoCatalogGate
        adoExecutionReady
        defaultProject={defaultProject}
        searchParams={sp}
        requiresSprint
      >
        {(catalog) => (
          <DailySummaryServer catalog={catalog}>
            {(data) => (
              <DailySummaryView
                inProgress={data.inProgress}
                sprintName={data.sprintName}
              />
            )}
          </DailySummaryServer>
        )}
      </AdoCatalogGate>
    </Suspense>
  );
}