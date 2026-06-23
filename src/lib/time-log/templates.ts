import "server-only";

import { eq, inArray, or } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { roles, timeLogTemplates, users } from "@/lib/db/schema";
import type { TimeLogTemplateRow } from "@/lib/db/ports/time-log-template.repository.port";
import { seedKeyForRoleName } from "@/lib/time-log/default-templates";

/**
 * Devuelve el `name` del rol del usuario (Developer / QA / Designer / etc.)
 * o `null` si no tiene rol asignado.
 */
export async function getRoleNameForUser(
  userId: string,
): Promise<string | null> {
  const rows = await getDb()
    .select({ roleName: roles.name })
    .from(users)
    .leftJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0]?.roleName ?? null;
}

/**
 * Devuelve todas las plantillas visibles para el usuario:
 *   - las del sistema que aplican a su rol (developer / qa / designer / product-owner)
 *   - la plantilla global (Reunión), que aplica a todos los roles
 *   - las plantillas personalizadas que el usuario haya creado
 *
 * Las plantillas del sistema son singleton (user_id = null) compartidas
 * entre todos los usuarios del mismo seedKey. Las personalizadas son
 * privadas (user_id = <uuid>).
 */
export async function listTemplatesForUser(
  userId: string,
  roleName: string | null | undefined,
): Promise<TimeLogTemplateRow[]> {
  const roleSeedKey = seedKeyForRoleName(roleName);
  const systemSeedKeys = roleSeedKey
    ? [roleSeedKey, "global"]
    : ["global"];

  return getDb()
    .select()
    .from(timeLogTemplates)
    .where(
      or(
        inArray(timeLogTemplates.seedKey, systemSeedKeys),
        eq(timeLogTemplates.userId, userId),
      ),
    )
    .orderBy(timeLogTemplates.seedKey, timeLogTemplates.name);
}
