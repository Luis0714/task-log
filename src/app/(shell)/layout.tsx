import { AppShell } from "@/components/layout/app-shell";
import { mapAuthStateToConnectionDisplay } from "@/lib/auth/connection-display";
import { getServerAuthState } from "@/lib/auth/server-state";

export const dynamic = "force-dynamic";

export default async function ShellLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const auth = await getServerAuthState();
  const connection = mapAuthStateToConnectionDisplay(auth);

  return <AppShell connection={connection}>{children}</AppShell>;
}
