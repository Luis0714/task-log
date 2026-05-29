import { DashboardShellServer } from "@/components/dashboard/dashboard-shell-server";
import { DashboardDemoShell } from "@/components/dashboard/dashboard-demo-shell";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";
import { DashboardMockSections } from "@/components/dashboard/dashboard-mock-sections";
import { DashboardSectionsStreamLoader } from "@/components/dashboard/dashboard-sections-stream-loader";
import { AdoContextPageLayout } from "@/components/ado/ado-context-page-layout";
import { DashboardShellSkeleton } from "@/components/skeletons/dashboard-shell-skeleton";
import { canLoadLiveAdoContent } from "@/lib/auth/auth-ui";
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
  const showLiveData = canLoadLiveAdoContent(auth);

  const header: DashboardHeaderData = {
    displayName: showLiveData
      ? (connection.userDisplayName ?? "Usuario")
      : "Hola",
    initials: showLiveData ? (connection.userInitials ?? "U") : "U",
    avatarUrl: showLiveData ? connection.userAvatarUrl : null,
    project: showLiveData
      ? (connection.project ?? "Sin proyecto")
      : "Vista previa — conecta para ver tu sprint",
    sprintName: "Sprint actual",
  };

  return (
    <AdoContextPageLayout
      gapClassName="gap-6"
      shellFallback={<DashboardShellSkeleton />}
      adoExecutionReady={showLiveData}
      connectOptions={auth.connectOptions}
      disconnectedFallback={<DashboardMockSections />}
      shell={
        showLiveData ? (
          <DashboardShellServer
            sp={sp}
            defaultProject={defaultProject}
            userSessionActive={auth.userSessionActive}
            adoExecutionReady={auth.adoExecutionReady}
            connectOptions={auth.connectOptions}
            header={header}
            initialSprintDayKey={sprintDayKey}
          />
        ) : (
          <DashboardDemoShell connectOptions={auth.connectOptions} />
        )
      }
      content={
        showLiveData ? (
          <DashboardSectionsStreamLoader
            sp={sp}
            defaultProject={defaultProject}
            adoExecutionReady={auth.adoExecutionReady}
            sprintDayKey={sprintDayKey}
          />
        ) : null
      }
    />
  );
}
