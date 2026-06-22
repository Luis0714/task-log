import { z } from "zod";

export const settingsProcessProfileQuerySchema = z.object({
  project: z.string().trim().min(1, "Indica el proyecto."),
});

export const updateSettingsProcessProfileSchema = z.object({
  project: z.string().trim().min(1, "Indica el proyecto."),
  workingDateField: z.string().trim().min(1, "Elige un campo de fecha."),
  timezone: z.string().trim().min(1, "Indica la zona horaria."),
  // campos admin opcionales
  completedWorkField: z.string().trim().optional(),
  originalEstimateField: z.string().trim().optional(),
  remainingWorkField: z.string().trim().nullable().optional(),
  activityField: z.string().trim().nullable().optional(),
  taskWorkItemType: z.string().trim().optional(),
  bugWorkItemType: z.string().trim().optional(),
  backlogItemType: z.string().trim().optional(),
  taskTodoState: z.string().trim().optional(),
  taskDoneState: z.string().trim().optional(),
});

export const settingsProcessProfileActionSchema = z.object({
  project: z.string().trim().min(1, "Indica el proyecto."),
});

export const testSettingsProcessProfileSchema = settingsProcessProfileActionSchema.extend({
  workingDateField: z.string().trim().min(1).optional(),
  timezone: z.string().trim().min(1).optional(),
});
