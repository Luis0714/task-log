import "server-only";

import { getDb } from "@/lib/db/client";
import { roles } from "@/lib/db/schema";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";
import { isManagementRole } from "@/lib/auth/management-roles";

export async function requireManagementUser(): Promise<
  | { ok: true; userId: string; roleName: string | null }
  | { ok: false; status: number; error: string }
> {
  if (!isIronSessionConfigured()) {
    return { ok: false, status: 401, error: "No autorizado." };
  }
  const session = await getTaskPilotSession();
  const userId = session.taskPilotUserId?.trim();
  if (!userId) {
    return { ok: false, status: 401, error: "No autorizado." };
  }
  const bootstrap = await getServerAuthBootstrap();
  if (!bootstrap.userSessionActive) {
    return { ok: false, status: 401, error: "No autorizado." };
  }
  if (!isManagementRole(bootstrap.userRole)) {
    return { ok: false, status: 403, error: "No autorizado." };
  }
  return { ok: true, userId, roleName: bootstrap.userRole };
}

export type AssignmentRoleOption = {
  id: string;
  name: string;
  displayName: string;
};

export async function listAssignmentRoleOptions(): Promise<AssignmentRoleOption[]> {
  const rows = await getDb().select().from(roles);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    displayName: r.displayName,
  }));
}
