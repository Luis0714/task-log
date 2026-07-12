import { z } from "zod";

import { csvOf } from "@/lib/schemas/csv-of";

export const hoursReportPeriodSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("month"),
    monthKey: z.string().regex(/^\d{4}-\d{2}$/, "Mes inválido (YYYY-MM)"),
  }),
  z.object({
    kind: z.literal("range"),
    fromIso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha desde inválida"),
    toIso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha hasta inválida"),
  }),
]);

export type HoursReportPeriodSchema = z.infer<typeof hoursReportPeriodSchema>;

export const hoursReportScopeSchema = z.object({
  projectIds: z.array(z.string()).default([]),
  teamIds: z.array(z.string()).default([]),
});

export type HoursReportScopeSchema = z.infer<typeof hoursReportScopeSchema>;

export const hoursReportRequestSchema = z.object({
  period: hoursReportPeriodSchema,
  scopes: hoursReportScopeSchema,
  personAdoId: z.string().optional(),
  roleId: z.string().optional(),
});

export type HoursReportRequestSchema = z.infer<typeof hoursReportRequestSchema>;

export const hoursReportExcelQuerySchema = z.object({
  periodKind: z.enum(["month", "range"]),
  monthKey: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  fromIso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  toIso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  projectIds: csvOf,
  teamIds: csvOf,
  personAdoId: z.string().optional(),
  roleId: z.string().optional(),
});

export type HoursReportExcelQuerySchema = z.infer<typeof hoursReportExcelQuerySchema>;