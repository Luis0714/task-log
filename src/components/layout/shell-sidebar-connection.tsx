import { AdoConnectionBadge } from "@/components/connection/ado-connection-badge";
import { mapAuthStateToConnectionDisplay } from "@/lib/auth/connection-display";
import { getServerAuthState } from "@/lib/auth/server-state";

export async function ShellSidebarConnection() {
  const auth = await getServerAuthState();
  const connection = mapAuthStateToConnectionDisplay(auth);

  return <AdoConnectionBadge {...connection} />;
}
