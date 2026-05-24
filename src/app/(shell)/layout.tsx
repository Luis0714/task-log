import { AppShell } from "@/components/layout/app-shell";
import { mapAuthStateToConnectionDisplay } from "@/lib/auth/connection-display";
import { getSidebarDefaultOpen } from "@/lib/layout/sidebar-state";
import { getServerAuthState } from "@/lib/auth/server-state";

export const dynamic = "force-dynamic";

export default async function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [auth, defaultSidebarOpen] = await Promise.all([
    getServerAuthState(),
    getSidebarDefaultOpen(),
  ]);
  const connection = mapAuthStateToConnectionDisplay(auth);

  return (
    <AppShell connection={connection} defaultSidebarOpen={defaultSidebarOpen}>
      {children}
    </AppShell>
  );
}
