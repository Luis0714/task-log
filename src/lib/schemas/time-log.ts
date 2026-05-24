import { z } from "zod";

import type { LogWorkPayload } from "@/lib/schemas/agent";

export const timeLogFormSchema = z.object({
  sprintPath: z.string().trim().min(1, "Selecciona un sprint."),
  workItemId: z
    .string()
    .trim()
    .min(1, "Selecciona un work item.")
    .refine((value) => {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) && parsed > 0;
    }, "Work item inválido."),
  hours: z
    .string()
    .trim()
    .min(1, "Ingresa las horas trabajadas.")
    .refine((value) => {
      const parsed = Number.parseFloat(value.replace(",", "."));
      return Number.isFinite(parsed) && parsed > 0 && parsed <= 24;
    }, "Las horas deben ser mayores a 0 y como máximo 24."),
  comment: z
    .string()
    .trim()
    .min(1, "El comentario es obligatorio.")
    .max(2000, "Máximo 2000 caracteres."),
});

export type TimeLogFormValues = z.infer<typeof timeLogFormSchema>;

export const TIME_LOG_FORM_DEFAULTS: TimeLogFormValues = {
  sprintPath: "",
  workItemId: "",
  hours: "",
  comment: "",
};

export function mapTimeLogFormToPayload(values: TimeLogFormValues): LogWorkPayload {
  return {
    action: "log_work",
    workItemId: Number.parseInt(values.workItemId, 10),
    hours: Number.parseFloat(values.hours.replace(",", ".")),
    comment: values.comment.trim(),
  };
}
