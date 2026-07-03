import { redirect } from "next/navigation";

import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { PageHeader } from "@/components/layout/page-header";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";
import { getTaskPilotSession } from "@/lib/auth/session";
import { getRepositories } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminUsuariosPage() {
  const bootstrap = await getServerAuthBootstrap();
  if (!bootstrap.isAdmin) redirect("/");

  const session = await getTaskPilotSession();
  const [users, roles] = await Promise.all([
    getRepositories().user.listAllWithRoles(),
    getRepositories().user.listRoles(),
  ]);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-6">
      <PageHeader
        title="Usuarios"
        description="Gestión de usuarios del sistema."
      />
      <AdminUsersTable
        users={users}
        roles={roles}
        currentUserId={session.taskPilotUserId}
      />
    </div>
  );
}
