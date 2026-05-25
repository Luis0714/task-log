import { Suspense } from "react";

import { DashboardShellServer } from "@/components/dashboard/dashboard-shell-server";
import { DashboardSectionsStreamLoader } from "@/components/dashboard/dashboard-sections-stream-loader";
import { DashboardShellSkeleton } from "@/components/skeletons/dashboard-shell-skeleton";
import { parseAdoContextSearchParams } from "@/lib/ado/parse-context-search-params";
import { mapAuthStateToConnectionDisplay } from "@/lib/auth/connection-display";
import { mergeServerAuthState } from "@/lib/auth/merge-auth-state";
import {
  getServerAuthBootstrap,
  getServerAuthProfile,
} from "@/lib/auth/server-state";
import type { DashboardHeaderData } from "@/lib/dashboard/types";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const sp = parseAdoContextSearchParams(await searchParams);
  const [bootstrap, profile] = await Promise.all([
    getServerAuthBootstrap(),
    getServerAuthProfile(),
  ]);
  const auth = mergeServerAuthState(bootstrap, profile);
  const connection = mapAuthStateToConnectionDisplay(auth);
  const defaultProject =
    auth.authMethod === "pat" ? auth.patProject : auth.defaultProject;
  const sprintDayKey = sp.sprintDay ?? "";

  const header: DashboardHeaderData = {
    displayName: connection.userDisplayName ?? "Usuario",
    initials: connection.userInitials ?? "U",
    avatarUrl: connection.userAvatarUrl,
    project: connection.project ?? "Sin proyecto",
    sprintName: "Sprint actual",
  };

  return (
    <div className="flex w-full flex-col gap-6 pb-6">
      <Suspense fallback={<DashboardShellSkeleton />}>
        <DashboardShellServer
          sp={sp}
          defaultProject={defaultProject}
          adoExecutionReady={auth.adoExecutionReady}
          header={header}
          initialSprintDayKey={sprintDayKey}
        />
      </Suspense>

      {auth.adoExecutionReady ? (
        <DashboardSectionsStreamLoader
          sp={sp}
          defaultProject={defaultProject}
          sprintDayKey={sprintDayKey}
        />
      ) : null}
    </div>
  );
}
