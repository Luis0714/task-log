import { DashboardShellServer } from "@/components/dashboard/dashboard-shell-server";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";
import { DashboardSectionsStreamLoader } from "@/components/dashboard/dashboard-sections-stream-loader";
import { AdoContextPageLayout } from "@/components/ado/ado-context-page-layout";
import { DashboardShellSkeleton } from "@/components/skeletons/dashboard-shell-skeleton";
import { mapAuthStateToConnectionDisplay } from "@/lib/auth/connection-display";
import { mergeServerAuthState } from "@/lib/auth/merge-auth-state";
import { resolvePageAuthWithProfile } from "@/lib/auth/resolve-page-auth";
import type { DashboardHeaderData } from "@/lib/dashboard/types";

export const metadata = buildPageMetadata(PAGE_SEO.dashboard);

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const { searchParams: sp, auth, defaultProject, profile } =
    await resolvePageAuthWithProfile(searchParams);
  const connection = mapAuthStateToConnectionDisplay(
    mergeServerAuthState(auth, profile),
  );
  const sprintDayKey = sp.sprintDay ?? "";

  const header: DashboardHeaderData = {
    displayName: connection.userDisplayName ?? "Usuario",
    initials: connection.userInitials ?? "U",
    avatarUrl: connection.userAvatarUrl,
    project: connection.project ?? "Sin proyecto",
    sprintName: "Sprint actual",
  };

  return (
    <AdoContextPageLayout
      gapClassName="gap-6"
      shellFallback={<DashboardShellSkeleton />}
      adoExecutionReady={auth.adoExecutionReady}
      shell={
        <DashboardShellServer
          sp={sp}
          defaultProject={defaultProject}
          adoExecutionReady={auth.adoExecutionReady}
          header={header}
          initialSprintDayKey={sprintDayKey}
        />
      }
      content={
        <DashboardSectionsStreamLoader
          sp={sp}
          defaultProject={defaultProject}
          adoExecutionReady={auth.adoExecutionReady}
          sprintDayKey={sprintDayKey}
        />
      }
    />
  );
}
