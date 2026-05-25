import { BugsView } from "@/components/bugs/bugs-view";
import { getServerAuthState } from "@/lib/auth/server-state";

export const dynamic = "force-dynamic";

export default async function BugsPage() {
  const auth = await getServerAuthState();
  const defaultProject =
    auth.authMethod === "pat" ? auth.patProject : auth.defaultProject;

  return (
    <BugsView
      adoExecutionReady={auth.adoExecutionReady}
      defaultProject={defaultProject}
    />
  );
}
