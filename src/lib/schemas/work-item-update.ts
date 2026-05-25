import { z } from "zod";

const dateKeySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD.");

export const updateWorkItemBodySchema = z.object({
  project: z.string().trim().min(1).max(200),
  state: z.string().trim().min(1).max(100),
  /** Historia/PBI vs task o bug. */
  workItemKind: z.enum(["backlog", "task"]).optional(),
  /** Equipo ADO (resuelve uniqueName en campos Identity del PBI). */
  team: z.string().trim().min(1).max(200).optional(),
  /** Fecha de trabajo (tasks/bugs); si falta, el servidor infiere o usa hoy. */
  workingDate: dateKeySchema.optional(),
  /** Horas en Completed Work (bugs y tasks). */
  completedWork: z.coerce.number().min(0).max(9999).optional(),
  /** PBI/HU → Committed */
  startDate: dateKeySchema.optional(),
  targetDate: dateKeySchema.optional(),
  /** PBI/HU → QA */
  responsableMaquetacion: z.string().trim().min(1).max(200).optional(),
  responsableIntegrador: z.string().trim().min(1).max(200).optional(),
  responsableQA: z.string().trim().min(1).max(200).optional(),
});

export function isBacklogWorkItemUpdate(body: UpdateWorkItemBody): boolean {
  return body.workItemKind === "backlog";
}

export type UpdateWorkItemBody = z.infer<typeof updateWorkItemBodySchema>;

/** @deprecated Usa updateWorkItemBodySchema */
export const updateWorkItemStateBodySchema = updateWorkItemBodySchema;
export type UpdateWorkItemStateBody = UpdateWorkItemBody;
