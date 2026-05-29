import { z } from "zod";

export const settingsProcessProfileQuerySchema = z.object({
  project: z.string().trim().min(1, "Indica el proyecto."),
});

export const updateSettingsProcessProfileSchema = z.object({
  project: z.string().trim().min(1, "Indica el proyecto."),
  workingDateField: z.string().trim().min(1, "Elige un campo de fecha."),
  timezone: z.string().trim().min(1, "Indica la zona horaria."),
});

export const settingsProcessProfileActionSchema = z.object({
  project: z.string().trim().min(1, "Indica el proyecto."),
});

export const testSettingsProcessProfileSchema = settingsProcessProfileActionSchema.extend({
  workingDateField: z.string().trim().min(1).optional(),
  timezone: z.string().trim().min(1).optional(),
});
