import "server-only";

import { and, eq } from "drizzle-orm";

import { timeLogTemplates } from "@/lib/db/schema";
import { getDb } from "@/lib/db/client";
import {
  TimeLogTemplateNotFoundError,
  type CreateTimeLogTemplateInput,
  type TimeLogTemplateRepository,
  type TimeLogTemplateRow,
  type UpdateTimeLogTemplateInput,
} from "@/lib/db/ports/time-log-template.repository.port";

export const drizzleTimeLogTemplateRepository: TimeLogTemplateRepository = {
  async create(
    userId: string,
    input: CreateTimeLogTemplateInput,
  ): Promise<TimeLogTemplateRow> {
    const defaultActivity = input.defaultActivity?.trim();
    const [row] = await getDb()
      .insert(timeLogTemplates)
      .values({
        userId,
        name: input.name.trim(),
        defaultTitle: input.defaultTitle.trim(),
        defaultDescription: input.defaultDescription.trim(),
        defaultActivity: defaultActivity && defaultActivity.length > 0
          ? defaultActivity
          : null,
        isSystem: false,
        seedKey: null,
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
    const defaultActivity = input.defaultActivity?.trim();
    const [row] = await getDb()
      .update(timeLogTemplates)
      .set({
        name: input.name.trim(),
        defaultTitle: input.defaultTitle.trim(),
        defaultDescription: input.defaultDescription.trim(),
        defaultActivity: defaultActivity && defaultActivity.length > 0
          ? defaultActivity
          : null,
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
};
