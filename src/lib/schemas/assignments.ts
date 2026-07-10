import { z } from "zod";

import { ASSIGNMENT_ERROR_CODES } from "@/lib/assignments/error-codes";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato YYYY-MM-DD.");

const isoDateAny = isoDate;

const workingDayDecisionItemSchema = z.object({
  date: isoDate,
  decision: z.enum(["habil_con_observacion", "no_habil"]),
  observation: z.string().trim().max(2000).nullable().optional(),
});

export const workingDayDecisionsSchema = z
  .array(workingDayDecisionItemSchema)
  .max(4000);

export type WorkingDayDecisionsPayload = z.infer<
  typeof workingDayDecisionsSchema
>;

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
  roleId: z.string().uuid(ASSIGNMENT_ERROR_CODES.roleRequired).nullable().optional(),
  assignmentPct: z
    .number({ message: ASSIGNMENT_ERROR_CODES.pctRequired })
    .int(ASSIGNMENT_ERROR_CODES.pctInteger)
    .min(1, ASSIGNMENT_ERROR_CODES.pctRange)
    .max(100, ASSIGNMENT_ERROR_CODES.pctRange),
  assignedMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Formato YYYY-MM.")
    .nullable()
    .optional(),
  validFrom: isoDateAny,
  validTo: z
    .union([isoDate, z.literal(""), z.null()])
    .optional()
    .transform((v) => (v == null || v === "" ? null : v)),
  workingDayDecisions: workingDayDecisionsSchema.optional(),
});

export const createAssignmentBodySchema = baseBody
  .refine(
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

export const changeAssignmentBodySchema = z.object({
  newAssignmentPct: baseBody.shape.assignmentPct,
  newRoleId: z
    .string()
    .uuid(ASSIGNMENT_ERROR_CODES.roleRequired)
    .nullable()
    .optional(),
  validFrom: isoDateAny,
});

export type ChangeAssignmentBody = z.infer<typeof changeAssignmentBodySchema>;

export const closeAssignmentBodySchema = z.object({
  validTo: isoDateAny,
});

export type CloseAssignmentBody = z.infer<typeof closeAssignmentBodySchema>;

export const assignmentFilterSchema = z.object({
  personAdoId: z.string().trim().optional(),
  projectId: z.string().trim().optional(),
  status: z.enum(["vigente", "historica", "todas"]).optional(),
});

export type AssignmentFilterSchema = z.infer<typeof assignmentFilterSchema>;
