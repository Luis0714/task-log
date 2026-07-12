import "server-only";

import { apiErrorResponse } from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";
import { isManagementRole } from "@/lib/auth/management-roles";

/** 403 para llamadas que no vengan de un rol de gestión. */
export async function requireManagementOr403(): Promise<Response | null> {
  const bootstrap = await getServerAuthBootstrap();
  if (isManagementRole(bootstrap.userRole)) return null;
  return apiErrorResponse(USER_MESSAGES.permissionsInsufficient, 403);
}
