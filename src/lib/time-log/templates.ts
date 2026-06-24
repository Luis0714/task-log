import "server-only";

import { asc, desc, eq, inArray, isNotNull, or } from "drizzle-orm";

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
 * Devuelve todas las plantillas visibles para el usuario, ordenadas:
 *   1. **Personales del usuario** (user_id = current) primero.
 *   2. **Del sistema** (user_id = NULL) agrupadas por seedKey (rol o global)
 *      y ordenadas alfabéticamente.
 *
 * Las plantillas del sistema son singleton (user_id = null) compartidas
 * entre todos los usuarios del mismo seedKey. Las personalizadas son
 * privadas (user_id = <uuid>).
 *
 * El `ORDER BY` usa `(user_id IS NOT NULL) DESC` para que las personales
 * (donde la expresión es TRUE = 1) queden antes que las del sistema
 * (donde es FALSE = 0).
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
    .orderBy(
      // Personales (user_id NOT NULL) primero, luego del sistema (NULL).
      // `desc(isNotNull(...))` devuelve TRUE antes que FALSE.
      desc(isNotNull(timeLogTemplates.userId)),
      asc(timeLogTemplates.seedKey),
      asc(timeLogTemplates.name),
    );
}
