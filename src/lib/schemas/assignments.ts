import { z } from "zod";

import { ASSIGNMENT_ERROR_CODES } from "@/lib/assignments/error-codes";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD.");

const isoDateAny = isoDate;

const baseBody = z.object({
  personAdoId: z.string().trim().min(1, ASSIGNMENT_ERROR_CODES.personRequired),
  personDisplayName: z.string().trim().min(1),
  personAdoIds: z
    .array(z.string().trim().min(1))
    .min(1, ASSIGNMENT_ERROR_CODES.personRequired)
    .optional(),
  projectId: z.string().trim().min(1, ASSIGNMENT_ERROR_CODES.projectRequired),
  projectName: z.string().trim().min(1),
  teamId: z.string().trim().max(128).nullable().optional(),
  teamName: z.string().trim().max(256).nullable().optional(),
  roleId: z.uuid({ error: ASSIGNMENT_ERROR_CODES.roleRequired }).nullable().optional(),
  assignmentPct: z
    .number({ message: ASSIGNMENT_ERROR_CODES.pctRequired })
    .int(ASSIGNMENT_ERROR_CODES.pctInteger)
    .min(1, ASSIGNMENT_ERROR_CODES.pctRange)
    .max(100, ASSIGNMENT_ERROR_CODES.pctRange),
  validFrom: isoDateAny,
  validTo: z
    .union([isoDate, z.literal(""), z.null()])
    .optional()
    .transform((v) => (v == null || v === "" ? null : v)),
});

export const createAssignmentBodySchema = baseBody.refine(
  (data) => {
    if (!data.validTo) return true;
    return new Date(data.validTo).getTime() >= new Date(data.validFrom).getTime();
  },
  {
    message: ASSIGNMENT_ERROR_CODES.endBeforeStart,
    path: ["validTo"],
  },
);

export type CreateAssignmentBody = z.infer<typeof createAssignmentBodySchema>;

/**
 * Edición inline de una asignación. Todos los campos son opcionales; sólo se
 * aplican los que vengan. Si la fecha de inicio cambia, el backend cierra la
 * vigencia anterior (`valid_to = newStart - 1`) y crea una nueva.
 */
export const editAssignmentBodySchema = z.object({
  projectId: z.string().trim().max(128).optional(),
  projectName: z.string().trim().max(256).optional(),
  teamId: z.string().trim().max(128).nullable().optional(),
  teamName: z.string().trim().max(256).nullable().optional(),
  roleId: z.uuid({ error: ASSIGNMENT_ERROR_CODES.roleRequired }).nullable().optional(),
  assignmentPct: baseBody.shape.assignmentPct.optional(),
  validFrom: isoDateAny.optional(),
  validTo: z
    .union([isoDate, z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" ? null : v)),
});

export type EditAssignmentBody = z.infer<typeof editAssignmentBodySchema>;

export const changeAssignmentBodySchema = z.object({
  newAssignmentPct: baseBody.shape.assignmentPct,
  newRoleId: z
    .uuid({ error: ASSIGNMENT_ERROR_CODES.roleRequired })
    .nullable()
    .optional(),
  validFrom: isoDateAny,
});

export type ChangeAssignmentBody = z.infer<typeof changeAssignmentBodySchema>;

export const closeAssignmentBodySchema = z.object({
  validTo: isoDateAny,
});

export type CloseAssignmentBody = z.infer<typeof closeAssignmentBodySchema>;

export const updateAssignmentPctBodySchema = z.object({
  assignmentPct: baseBody.shape.assignmentPct,
});

export type UpdateAssignmentPctBody = z.infer<
  typeof updateAssignmentPctBodySchema
>;

export const assignmentFilterSchema = z.object({
  personAdoId: z.string().trim().optional(),
  projectId: z.string().trim().optional(),
});

export type AssignmentFilterSchema = z.infer<typeof assignmentFilterSchema>;
