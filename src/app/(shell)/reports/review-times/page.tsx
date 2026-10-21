import { AdoContextPageLayout } from "@/components/ado/ado-context-page-layout";
import { ReviewTimesShellServer } from "@/components/reports/review-times/review-times-shell-server";
import { ReviewTimesSkeleton } from "@/components/reports/review-times/review-times-skeleton";
import { canLoadLiveAdoContent } from "@/lib/auth/auth-ui";
import { resolvePageAuth } from "@/lib/auth/resolve-page-auth";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.reportsReviewTimes);

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReportsReviewTimesPage({
  searchParams,
}: Readonly<PageProps>) {
  const rawSearchParams = await searchParams;
  const { auth, defaultProject } = await resolvePageAuth(Promise.resolve(rawSearchParams));
  const showLiveData = canLoadLiveAdoContent(auth);

  return (
    <AdoContextPageLayout
      shellFallback={<ReviewTimesSkeleton />}
      adoExecutionReady={showLiveData}
      connectOptions={auth.connectOptions}
      savedConnectionTarget={auth.savedConnectionTarget}
      shell={
        <ReviewTimesShellServer
          searchParams={rawSearchParams}
          defaultProject={defaultProject}
          adoExecutionReady={showLiveData}
        />
      }
    />
  );
}
