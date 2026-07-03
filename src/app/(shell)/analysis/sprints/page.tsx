import { AdoContextPageLayout } from "@/components/ado/ado-context-page-layout";
import { SprintsShellServer } from "@/components/sprints/sprints-shell-server";
import { TimeLogShellSkeleton } from "@/components/skeletons/time-log-shell-skeleton";
import { canLoadLiveAdoContent } from "@/lib/auth/auth-ui";
import { resolvePageAuth } from "@/lib/auth/resolve-page-auth";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO.sprints);

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SprintsPage({ searchParams }: PageProps) {
  const { searchParams: sp, auth, defaultProject } = await resolvePageAuth(searchParams);
  const showLiveData = canLoadLiveAdoContent(auth);

  return (
    <AdoContextPageLayout
      shellFallback={<TimeLogShellSkeleton />}
      adoExecutionReady={showLiveData}
      connectOptions={auth.connectOptions}
      savedConnectionTarget={auth.savedConnectionTarget}
      shell={
        <SprintsShellServer
          sp={sp}
          defaultProject={defaultProject}
          adoExecutionReady={showLiveData}
        />
      }
    />
  );
}
