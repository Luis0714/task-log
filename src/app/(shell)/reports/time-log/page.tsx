import { AdoContextPageLayout } from "@/components/ado/ado-context-page-layout";
import { ReportsTimeLogShellServer } from "@/components/reports/time-log/reports-time-log-shell-server";
import { TimeLogShellSkeleton } from "@/components/skeletons/time-log-shell-skeleton";
import { canLoadLiveAdoContent } from "@/lib/auth/auth-ui";
import { resolvePageAuth } from "@/lib/auth/resolve-page-auth";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.reportsTimeLog);

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ReportsTimeLogPage({ searchParams }: PageProps) {
  const { searchParams: sp, auth, defaultProject } = await resolvePageAuth(searchParams);
  const showLiveData = canLoadLiveAdoContent(auth);

  return (
    <AdoContextPageLayout
      shellFallback={<TimeLogShellSkeleton />}
      adoExecutionReady={showLiveData}
      connectOptions={auth.connectOptions}
      savedConnectionTarget={auth.savedConnectionTarget}
      shell={
        <ReportsTimeLogShellServer
          sp={sp}
          defaultProject={defaultProject}
          adoExecutionReady={showLiveData}
        />
      }
    />
  );
}
