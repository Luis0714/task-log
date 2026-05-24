import { TimeLogView } from "@/components/time-log/time-log-view";
import { getServerAuthState } from "@/lib/auth/server-state";

export const dynamic = "force-dynamic";

export default async function TimeLogPage() {
  const auth = await getServerAuthState();
  const defaultProject =
    auth.authMethod === "pat" ? auth.patProject : auth.defaultProject;

  return (
    <TimeLogView
      adoExecutionReady={auth.adoExecutionReady}
      authMethod={auth.authMethod}
      defaultProject={defaultProject}
    />
  );
}
