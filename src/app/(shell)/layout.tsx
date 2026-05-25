import { Suspense } from "react";

import { AdoConnectionBadgeSkeleton } from "@/components/connection/ado-connection-badge-skeleton";
import { AppShell } from "@/components/layout/app-shell";
import { ShellSidebarConnection } from "@/components/layout/shell-sidebar-connection";
import { mapAuthStateToConnectionDisplay } from "@/lib/auth/connection-display";
import { mergeServerAuthState } from "@/lib/auth/merge-auth-state";
import { emptyServerProfileFields } from "@/lib/auth/profile-display";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";
import { getSidebarDefaultOpen } from "@/lib/layout/sidebar-state";

export const dynamic = "force-dynamic";

export default async function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [bootstrap, defaultSidebarOpen] = await Promise.all([
    getServerAuthBootstrap(),
    getSidebarDefaultOpen(),
  ]);
  const connection = mapAuthStateToConnectionDisplay(
    mergeServerAuthState(bootstrap, emptyServerProfileFields),
  );

  return (
    <AppShell
      connection={connection}
      defaultSidebarOpen={defaultSidebarOpen}
      sidebarConnection={
        <Suspense
          fallback={<AdoConnectionBadgeSkeleton connection={connection} />}
        >
          <ShellSidebarConnection />
        </Suspense>
      }
    >
      {children}
    </AppShell>
  );
}
