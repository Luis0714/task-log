import { Suspense } from "react";

import { AdoConnectionBadgeSkeleton } from "@/components/connection/ado-connection-badge-skeleton";
import { buildShellLayoutMetadata } from "@/lib/seo/metadata";
import { AppShell } from "@/components/layout/app-shell";
import { ShellSidebarConnection } from "@/components/layout/shell-sidebar-connection";
import { mapAuthStateToConnectionDisplay } from "@/lib/auth/connection-display";
import { getHistoryScopeKey } from "@/lib/auth/history-scope";
import { getServerAuthState } from "@/lib/auth/server-state";
import { getSidebarDefaultOpen } from "@/lib/layout/sidebar-state";

export const metadata = buildShellLayoutMetadata();

export const dynamic = "force-dynamic";

export default async function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [authState, defaultSidebarOpen, historyScopeKey] = await Promise.all([
    getServerAuthState(),
    getSidebarDefaultOpen(),
    getHistoryScopeKey(),
  ]);
  const connection = mapAuthStateToConnectionDisplay(authState);

  return (
    <AppShell
      connection={connection}
      historyScopeKey={historyScopeKey}
      defaultSidebarOpen={defaultSidebarOpen}
      isAdmin={authState.isAdmin}
      sidebarConnection={
        <Suspense
          fallback={<AdoConnectionBadgeSkeleton connection={connection} />}
        >
          <ShellSidebarConnection connection={connection} />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
