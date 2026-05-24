import { DashboardView } from "@/components/dashboard/dashboard-view";
import { mapAuthStateToConnectionDisplay } from "@/lib/auth/connection-display";
import { getServerAuthState } from "@/lib/auth/server-state";
import type { DashboardHeaderData } from "@/lib/dashboard/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const auth = await getServerAuthState();
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

  return (
    <DashboardView
      header={header}
      adoExecutionReady={auth.adoExecutionReady}
      defaultProject={defaultProject}
    />
  );
}
