import { z } from "zod";

const dateKeySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD.");

export const updateWorkItemBodySchema = z.object({
  project: z.string().trim().min(1).max(200),
  state: z.string().trim().min(1).max(100),
  /** Fecha de trabajo (UI); si falta, el servidor infiere o usa hoy. */
  workingDate: dateKeySchema.optional(),
  /** Horas en Completed Work (bugs y tasks). */
  completedWork: z.coerce.number().min(0).max(9999).optional(),
});

export type UpdateWorkItemBody = z.infer<typeof updateWorkItemBodySchema>;

/** @deprecated Usa updateWorkItemBodySchema */
export const updateWorkItemStateBodySchema = updateWorkItemBodySchema;
export type UpdateWorkItemStateBody = UpdateWorkItemBody;
