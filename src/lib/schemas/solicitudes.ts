import { z } from "zod";

import { SOLICITUD_ERROR_CODES } from "@/lib/solicitudes/error-codes";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, SOLICITUD_ERROR_CODES.invalidDate);

const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, SOLICITUD_ERROR_CODES.invalidTime);

const timeUnit = z.enum(["horas", "dias"]);

export const createSolicitudBodySchema = z
  .object({
    project: z.string().trim().min(1, SOLICITUD_ERROR_CODES.projectRequired),
    /** Equipo (nombre) del scope de la HU; `null`/ausente = HU a nivel proyecto. */
    team: z.string().trim().nullish(),
    newsStoryId: z
      .number({ message: SOLICITUD_ERROR_CODES.newsStoryRequired })
      .int()
      .positive(SOLICITUD_ERROR_CODES.newsStoryRequired),
    assignedTo: z.string().trim().min(1, SOLICITUD_ERROR_CODES.assigneeRequired),
    tipo: z.string().trim().min(1, SOLICITUD_ERROR_CODES.tipoRequired),
    description: z
      .string()
      .trim()
      .max(500, SOLICITUD_ERROR_CODES.descriptionTooLong)
      .optional()
      .default(""),
    value: z
      .number({ message: SOLICITUD_ERROR_CODES.timePositive })
      .positive(SOLICITUD_ERROR_CODES.timePositive),
    unit: timeUnit,
    startDate: isoDate,
    startTime: time,
    endDate: isoDate,
    endTime: time,
    fechaReintegro: isoDate,
    reintegroTime: time,
    state: z.string().trim().max(50).optional().default(""),
    title: z
      .string()
      .trim()
      .min(1, SOLICITUD_ERROR_CODES.titleRequired)
      .max(150, SOLICITUD_ERROR_CODES.titleTooLong),
  })
  .refine((data) => `${data.endDate}T${data.endTime}` >= `${data.startDate}T${data.startTime}`, {
    message: SOLICITUD_ERROR_CODES.endBeforeStart,
    path: ["endDate"],
  })
  .refine((data) => data.fechaReintegro >= data.endDate, {
    message: SOLICITUD_ERROR_CODES.reintegroBeforeEnd,
    path: ["fechaReintegro"],
  });

export type CreateSolicitudBody = z.infer<typeof createSolicitudBodySchema>;

/**
 * Body para PATCH /api/solicitudes/[id]. Mismo esquema que la creación; el
 * server lo aplica sobre el work item existente.
 */
export const updateSolicitudBodySchema = createSolicitudBodySchema;

export const solicitudOptionsQuerySchema = z.object({
  project: z.string().trim().min(1, SOLICITUD_ERROR_CODES.projectRequired),
});

export type SolicitudOptionsQuery = z.infer<typeof solicitudOptionsQuerySchema>;
