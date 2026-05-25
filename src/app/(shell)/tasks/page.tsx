import { TasksView } from "@/components/tasks/tasks-view";
import { getServerAuthState } from "@/lib/auth/server-state";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const auth = await getServerAuthState();
  const defaultProject =
    auth.authMethod === "pat" ? auth.patProject : auth.defaultProject;

  return (
    <TasksView
      adoExecutionReady={auth.adoExecutionReady}
      defaultProject={defaultProject}
    />
  );
}
