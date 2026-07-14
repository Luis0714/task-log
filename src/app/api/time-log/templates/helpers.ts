import "server-only";

import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { isUserPersistenceReady } from "@/lib/db";

export type TemplateSessionResult =
  | { ok: true; userId: string; roleName: string | null }
  | { ok: false; status: number; error: string };

/**
 * Sesión requerida para las rutas de plantillas de time-log. Por defecto el
 * rol sale de la sesión; pasar `resolveRoleName` cuando el caller necesita el
 * rol resuelto desde la base de datos.
 */
export async function requireTemplateSessionUser(
  resolveRoleName?: (userId: string) => Promise<string | null>,
): Promise<TemplateSessionResult> {
  if (!isIronSessionConfigured() || !isUserPersistenceReady()) {
    return { ok: false, status: 403, error: "No autorizado." };
  }
  const session = await getTaskPilotSession();
  const userId = session.taskPilotUserId?.trim();
  if (!userId) {
    return { ok: false, status: 401, error: "No autorizado." };
  }
  const roleName = resolveRoleName
    ? await resolveRoleName(userId)
    : session.userRole ?? null;
  return { ok: true, userId, roleName };
}

export function rejectNonAdminIfGlobal(
  isGlobal: boolean | undefined,
  roleName: string | null,
): { ok: true } | { ok: false; status: number; error: string } {
  if (!isGlobal) return { ok: true };
  if (roleName === "super_admin") return { ok: true };
  return {
    ok: false,
    status: 403,
    error: "Solo un super administrador puede crear plantillas globales.",
  };
}
