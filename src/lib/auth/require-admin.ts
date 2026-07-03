import "server-only";

import { apiErrorResponse } from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";

/**
 * Defensa de API: rechaza con 403 cuando el usuario no es super admin.
 *
 * Devuelve `null` si el caller tiene permiso; si no, devuelve la respuesta
 * 403 lista para retornar. Mantiene el mensaje opaco para no filtrar que
 * la ruta existe para roles inferiores.
 */
export async function requireAdminOr403(): Promise<Response | null> {
  const bootstrap = await getServerAuthBootstrap();
  if (bootstrap.isAdmin) return null;
  return apiErrorResponse(USER_MESSAGES.permissionsInsufficient, 403);
}