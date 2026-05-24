import { z } from "zod";

export const previewActionSchema = z.enum(["log_work", "needs_clarification", "unsupported"]);

export const logWorkPayloadSchema = z.object({
  action: z.literal("log_work"),
  workItemId: z.number().int().positive(),
  hours: z.number().positive().max(24),
  comment: z.string().min(1).max(2000),
});

export const needsClarificationPayloadSchema = z.object({
  action: z.literal("needs_clarification"),
  question: z.string().min(1).max(500),
});

export const unsupportedPayloadSchema = z.object({
  action: z.literal("unsupported"),
  reason: z.string().min(1).max(500),
});

export const previewResultSchema = z.discriminatedUnion("action", [
  logWorkPayloadSchema,
  needsClarificationPayloadSchema,
  unsupportedPayloadSchema,
]);

export type PreviewResult = z.infer<typeof previewResultSchema>;
export type LogWorkPayload = z.infer<typeof logWorkPayloadSchema>;

export const executeRequestSchema = z.object({
  preview: logWorkPayloadSchema,
  project: z.string().trim().min(1).max(200).optional(),
});
