import { TasksView } from "@/components/tasks/tasks-view";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const auth = await getServerAuthBootstrap();
  const defaultProject =
    auth.authMethod === "pat" ? auth.patProject : auth.defaultProject;

  return (
    <TasksView
      adoExecutionReady={auth.adoExecutionReady}
      defaultProject={defaultProject}
    />
  );
}
