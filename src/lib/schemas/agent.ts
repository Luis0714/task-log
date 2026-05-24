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

export const createTaskRequestSchema = z.object({
  action: z.literal("create_task"),
  pbiId: z.number().int().positive(),
  pbiTitle: z.string().min(1).max(500),
  title: z.string().min(1).max(256),
  hours: z.number().positive().max(24),
  description: z.string().max(2000),
  activity: z.string().min(1).max(100),
  workingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  state: z.enum(["To Do", "Done"]),
  sprintPath: z.string().min(1).max(500),
  team: z.string().min(1).max(200),
});

export type CreateTaskRequest = z.infer<typeof createTaskRequestSchema>;

export const executeRequestSchema = z.object({
  preview: logWorkPayloadSchema,
  project: z.string().trim().min(1).max(200).optional(),
});

export const executeCreateTaskRequestSchema = z.object({
  task: createTaskRequestSchema,
  project: z.string().trim().min(1).max(200).optional(),
});
