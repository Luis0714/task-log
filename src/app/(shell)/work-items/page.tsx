import { WorkItemsView } from "@/components/work-items/work-items-view";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";

export const dynamic = "force-dynamic";

export default async function WorkItemsPage() {
  const auth = await getServerAuthBootstrap();
  const defaultProject =
    auth.authMethod === "pat" ? auth.patProject : auth.defaultProject;

  return (
    <WorkItemsView
      adoExecutionReady={auth.adoExecutionReady}
      defaultProject={defaultProject}
      currentUserDisplayName={auth.profileDisplayName}
    />
  );
}
