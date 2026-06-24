import { z } from "zod";

import { WORKING_TIME_PATTERN } from "@/lib/date/ado-datetime";

const dateKeySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD.");

export const userStoryWorkflowTagSchema = z.enum([
  "none",
  "en-desarrollo",
  "desarrollada",
]);

export const updateWorkItemBodySchema = z.object({
  project: z.string().trim().min(1).max(200),
  state: z.string().trim().min(1).max(100),
  /** Historia/PBI vs task o bug. */
  workItemKind: z.enum(["backlog", "task"]).optional(),
  /** Equipo ADO (resuelve uniqueName en campos Identity del PBI). */
  team: z.string().trim().min(1).max(200).optional(),
  /** Fecha de trabajo (tasks/bugs); si falta, el servidor infiere o usa hoy. */
  workingDate: dateKeySchema.optional(),
  /** Hora de trabajo (HH:mm), en la zona del proyecto. */
  workingTime: z
    .string()
    .trim()
    .regex(WORKING_TIME_PATTERN, "La hora debe tener formato HH:mm (24 h).")
    .optional(),
  /** Horas en Completed Work (bugs y tasks). */
  completedWork: z.coerce.number().min(0).max(9999).optional(),
  /** PBI/HU → Committed */
  startDate: dateKeySchema.optional(),
  targetDate: dateKeySchema.optional(),
  /**
   * PBI/HU → QA: mapa `referenceName → displayName` para todos los
   * Responsables configurados en el proyecto. Si falta un valor y el campo
   * tiene `defaultToCurrentUser=true`, el servidor usa el usuario logueado.
   */
  responsables: z.record(z.string(), z.string().trim().min(1).max(200)).optional(),
  /** Tag de flujo de la HU (EN DESARROLLO / DESARROLLADA). */
  workflowTag: userStoryWorkflowTagSchema.optional(),
  /** Tags completos de la HU (`System.Tags`). */
  tags: z.array(z.string().trim().min(1).max(200)).optional(),
});

export function isBacklogWorkItemUpdate(body: UpdateWorkItemBody): boolean {
  return body.workItemKind === "backlog";
}

export type UpdateWorkItemBody = z.infer<typeof updateWorkItemBodySchema>;

/** @deprecated Usa updateWorkItemBodySchema */
export const updateWorkItemStateBodySchema = updateWorkItemBodySchema;
export type UpdateWorkItemStateBody = UpdateWorkItemBody;