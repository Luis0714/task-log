import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";

import { timeLogTemplates, users } from "@/lib/db/schema";
import { getDb } from "@/lib/db/client";
import {
  TimeLogTemplateNotFoundError,
  type AdminCreateTimeLogTemplateInput,
  type CreateTimeLogTemplateInput,
  type TimeLogTemplateRepository,
  type TimeLogTemplateRow,
  type UpdateTimeLogTemplateInput,
} from "@/lib/db/ports/time-log-template.repository.port";

function trimToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function resolveScopeFlags(isGlobal: boolean | undefined): {
  isSystem: boolean;
  seedKey: string | null;
} {
  if (isGlobal) return { isSystem: true, seedKey: "global" };
  return { isSystem: false, seedKey: null };
}

export const drizzleTimeLogTemplateRepository: TimeLogTemplateRepository = {
  async create(
    userId: string,
    input: CreateTimeLogTemplateInput,
  ): Promise<TimeLogTemplateRow> {
    const scope = resolveScopeFlags(input.isGlobal);
    const [row] = await getDb()
      .insert(timeLogTemplates)
      .values({
        userId,
        name: input.name.trim(),
        defaultTitle: input.defaultTitle.trim(),
        defaultDescription: input.defaultDescription.trim(),
        defaultActivity: trimToNull(input.defaultActivity),
        defaultHours: input.defaultHours ?? null,
        isSystem: scope.isSystem,
        seedKey: scope.seedKey,
      })
      .returning();
    if (!row) throw new Error("No se pudo crear la plantilla.");
    return row;
  },

  async updateForUser(
    userId: string,
    templateId: string,
    input: UpdateTimeLogTemplateInput,
  ): Promise<TimeLogTemplateRow> {
    const scope = resolveScopeFlags(input.isGlobal);
    const [row] = await getDb()
      .update(timeLogTemplates)
      .set({
        name: input.name.trim(),
        defaultTitle: input.defaultTitle.trim(),
        defaultDescription: input.defaultDescription.trim(),
        defaultActivity: trimToNull(input.defaultActivity),
        defaultHours: input.defaultHours ?? null,
        isSystem: scope.isSystem,
        seedKey: scope.seedKey,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(timeLogTemplates.id, templateId),
          eq(timeLogTemplates.userId, userId),
        ),
      )
      .returning();
    if (!row) throw new TimeLogTemplateNotFoundError();
    return row;
  },

  async deleteForUser(userId: string, templateId: string): Promise<void> {
    // El WHERE incluye `user_id = userId` para impedir borrar plantillas
    // del sistema (cuyo `user_id` es null) incluso si se conoce el id.
    const result = await getDb()
      .delete(timeLogTemplates)
      .where(
        and(
          eq(timeLogTemplates.id, templateId),
          eq(timeLogTemplates.userId, userId),
        ),
      )
      .returning({ id: timeLogTemplates.id });
    if (result.length === 0) {
      throw new TimeLogTemplateNotFoundError();
    }
  },

  /**
   * Lista TODAS las plantillas con LEFT JOIN a `users` para incluir el
   * `displayName` del autor. Devuelve filas planas (no DTO) — el caller
   * hace el `toDto` y popula `authorName` desde `authorDisplayName`.
   */
  async adminListAll(): Promise<
    Array<TimeLogTemplateRow & { authorDisplayName: string | null }>
  > {
    return getDb()
      .select({
        id: timeLogTemplates.id,
        userId: timeLogTemplates.userId,
        name: timeLogTemplates.name,
        defaultTitle: timeLogTemplates.defaultTitle,
        defaultDescription: timeLogTemplates.defaultDescription,
        defaultActivity: timeLogTemplates.defaultActivity,
        defaultHours: timeLogTemplates.defaultHours,
        isSystem: timeLogTemplates.isSystem,
        seedKey: timeLogTemplates.seedKey,
        createdAt: timeLogTemplates.createdAt,
        updatedAt: timeLogTemplates.updatedAt,
        authorDisplayName: users.displayName,
      })
      .from(timeLogTemplates)
      .leftJoin(users, eq(timeLogTemplates.userId, users.id))
      .orderBy(asc(timeLogTemplates.seedKey), asc(timeLogTemplates.name));
  },

  async adminCreate(
    currentAdminId: string,
    input: AdminCreateTimeLogTemplateInput,
  ): Promise<TimeLogTemplateRow> {
    const isPersonal = input.scope === "personal";
    const [row] = await getDb()
      .insert(timeLogTemplates)
      .values({
        userId: isPersonal ? currentAdminId : null,
        name: input.name.trim(),
        defaultTitle: input.defaultTitle.trim(),
        defaultDescription: input.defaultDescription.trim(),
        defaultActivity: trimToNull(input.defaultActivity),
        defaultHours: input.defaultHours ?? null,
        isSystem: !isPersonal,
        seedKey: isPersonal ? null : input.scope,
      })
      .returning();
    if (!row) throw new Error("No se pudo crear la plantilla.");
    return row;
  },

  async adminUpdate(
    currentAdminId: string,
    id: string,
    input: AdminCreateTimeLogTemplateInput,
  ): Promise<TimeLogTemplateRow> {
    const isPersonal = input.scope === "personal";
    const [row] = await getDb()
      .update(timeLogTemplates)
      .set({
        name: input.name.trim(),
        defaultTitle: input.defaultTitle.trim(),
        defaultDescription: input.defaultDescription.trim(),
        defaultActivity: trimToNull(input.defaultActivity),
        defaultHours: input.defaultHours ?? null,
        userId: isPersonal ? currentAdminId : null,
        isSystem: !isPersonal,
        seedKey: isPersonal ? null : input.scope,
        updatedAt: new Date(),
      })
      .where(eq(timeLogTemplates.id, id))
      .returning();
    if (!row) throw new TimeLogTemplateNotFoundError();
    return row;
  },

  async adminDelete(id: string): Promise<void> {
    const result = await getDb()
      .delete(timeLogTemplates)
      .where(eq(timeLogTemplates.id, id))
      .returning({ id: timeLogTemplates.id });
    if (result.length === 0) {
      throw new TimeLogTemplateNotFoundError();
    }
  },
};

/**
 * Helper para hidratar `authorName` de una o varias filas devueltas por
 * `adminCreate` / `adminUpdate` (que NO incluyen el JOIN). Evita el N+1
 * haciendo una sola query `users WHERE id IN (...)` cuando hay ids.
 */
export async function fetchAuthorNames(
  userIds: ReadonlyArray<string>,
): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  const rows = await getDb()
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
    .where(inArray(users.id, [...userIds]));
  const map = new Map<string, string>();
  for (const r of rows) {
    if (r.displayName) map.set(r.id, r.displayName);
  }
  return map;
}

