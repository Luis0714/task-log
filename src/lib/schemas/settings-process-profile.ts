import { z } from "zod";

export const settingsProcessProfileQuerySchema = z.object({
  project: z.string().trim().min(1, "Indica el proyecto."),
});

export const responsableFieldSchema = z.object({
  key: z.string().trim().min(1),
  referenceName: z.string().trim().min(1),
  label: z.string().trim().min(1),
  defaultToCurrentUser: z.boolean(),
});

export const updateSettingsProcessProfileSchema = z.object({
  project: z.string().trim().min(1, "Indica el proyecto."),
  workingDateField: z.string().trim().min(1, "Elige un campo de fecha."),
  timezone: z.string().trim().min(1, "Indica la zona horaria."),
  // campos admin opcionales
  completedWorkField: z.string().trim().nullable().optional(),
  originalEstimateField: z.string().trim().nullable().optional(),
  remainingWorkField: z.string().trim().nullable().optional(),
  activityField: z.string().trim().nullable().optional(),
  taskWorkItemType: z.string().trim().optional(),
  bugWorkItemType: z.string().trim().optional(),
  backlogItemType: z.string().trim().optional(),
  taskTodoState: z.string().trim().optional(),
  taskDoneState: z.string().trim().optional(),
  /**
   * Lista de Responsables configurados por el admin para este proyecto.
   * Cada elemento: `{ key, referenceName, label, defaultToCurrentUser }`.
   */
  responsableFields: z.array(responsableFieldSchema).optional(),
});

export const settingsProcessProfileActionSchema = z.object({
  project: z.string().trim().min(1, "Indica el proyecto."),
});

export const testSettingsProcessProfileSchema = settingsProcessProfileActionSchema.extend({
  workingDateField: z.string().trim().min(1).optional(),
  timezone: z.string().trim().min(1).optional(),
});
