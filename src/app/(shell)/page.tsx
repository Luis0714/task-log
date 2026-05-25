import { Suspense } from "react";

import { DashboardBodyServer } from "@/components/dashboard/dashboard-body-server";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import { ShellContentSkeleton } from "@/components/skeletons/shell-content-skeleton";
import { loadAdoCatalog } from "@/lib/ado/load-ado-catalog";
import { loadNonWorkingDates } from "@/lib/ado/load-non-working-dates";
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

  const header: DashboardHeaderData = {
    displayName: connection.userDisplayName ?? "Usuario",
    initials: connection.userInitials ?? "U",
    avatarUrl: connection.userAvatarUrl,
    project: connection.project ?? "Sin proyecto",
    sprintName: "Sprint actual",
  };

  const emptyCatalog = await loadAdoCatalog(null, {});
  const catalog = auth.adoExecutionReady
    ? await loadAdoCatalog(defaultProject, sp)
    : emptyCatalog;

  const sprintDayKey = sp.sprintDay ?? "";
  const nonWorkingDates =
    auth.adoExecutionReady && catalog.project && catalog.team
      ? await loadNonWorkingDates(catalog.project, catalog.team)
      : [];

  const suspenseKey = [
    catalog.project,
    catalog.team,
    catalog.sprintPath,
    sprintDayKey,
  ].join("|");

  return (
    <DashboardPageShell
      header={header}
      catalog={catalog}
      adoExecutionReady={auth.adoExecutionReady}
      initialSprintDayKey={sprintDayKey}
      nonWorkingDates={nonWorkingDates}
    >
      {auth.adoExecutionReady && catalog.sprintPath ? (
        <Suspense key={suspenseKey} fallback={<ShellContentSkeleton />}>
          <DashboardBodyServer catalog={catalog} sprintDayKey={sprintDayKey} />
        </Suspense>
      ) : null}
    </DashboardPageShell>
  );
}
