import { z } from "zod";

import { WORKING_TIME_PATTERN } from "@/lib/date/ado-datetime";

export const previewActionSchema = z.enum([
  "log_work_batch",
  "create_tasks_batch",
  "needs_clarification",
  "unsupported",
]);

export const logWorkItemSchema = z.object({
  action: z.literal("log_work"),
  workItemId: z.number().int().positive(),
  hours: z.number().positive().max(24),
  comment: z.string().min(1).max(2000),
});

export const logWorkBatchSchema = z.object({
  action: z.literal("log_work_batch"),
  items: z.array(logWorkItemSchema).min(1).max(10),
});

export const createTaskRequestSchema = z.object({
  action: z.literal("create_task"),
  pbiId: z.number().int().positive(),
  pbiTitle: z.string().min(1).max(500),
  title: z.string().min(1).max(256),
  hours: z.number().positive().max(24),
  description: z.string().trim().min(1).max(2000),
  activity: z.string().min(1).max(100),
  workingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  workingTime: z.string().regex(WORKING_TIME_PATTERN),
  state: z.string().trim().min(1).max(100),
  markAsDone: z.boolean().optional().default(false),
  sprintPath: z.string().min(1).max(500),
  team: z.string().min(1).max(200),
});

export type CreateTaskRequest = z.infer<typeof createTaskRequestSchema>;

const createTaskBatchItemSchema = createTaskRequestSchema.omit({ action: true });

export const createTasksBatchSchema = z.object({
  action: z.literal("create_tasks_batch"),
  pbiId: z.number().int().positive(),
  pbiTitle: z.string().min(1).max(500),
  tasks: z.array(createTaskBatchItemSchema).min(1).max(10),
});

export const pbiCandidateSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(500),
  state: z.string().min(1).max(100).optional(),
});

export const needsClarificationPayloadSchema = z.object({
  action: z.literal("needs_clarification"),
  question: z.string().min(1).max(500),
  candidates: z.array(pbiCandidateSchema).max(8).optional(),
});

export const unsupportedPayloadSchema = z.object({
  action: z.literal("unsupported"),
  reason: z.string().min(1).max(500),
});

export const previewResultSchema = z.discriminatedUnion("action", [
  logWorkBatchSchema,
  createTasksBatchSchema,
  needsClarificationPayloadSchema,
  unsupportedPayloadSchema,
]);

export type PreviewResult = z.infer<typeof previewResultSchema>;
export type LogWorkItem = z.infer<typeof logWorkItemSchema>;
export type LogWorkBatch = z.infer<typeof logWorkBatchSchema>;
export type CreateTasksBatch = z.infer<typeof createTasksBatchSchema>;
export type CreateTaskBatchItem = z.infer<typeof createTaskBatchItemSchema>;
export type NeedsClarificationPayload = z.infer<typeof needsClarificationPayloadSchema>;
export type PbiCandidate = z.infer<typeof pbiCandidateSchema>;
export type UnsupportedPayload = z.infer<typeof unsupportedPayloadSchema>;

export const executeRequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("log_work"),
    preview: logWorkItemSchema,
    project: z.string().trim().min(1).max(200).optional(),
  }),
  z.object({
    action: z.literal("log_work_batch"),
    previews: z.array(logWorkItemSchema).min(1).max(10),
    project: z.string().trim().min(1).max(200).optional(),
  }),
]);

export const executeCreateTaskRequestSchema = z.object({
  task: createTaskRequestSchema,
  project: z.string().trim().min(1).max(200).optional(),
});

export const executeCreateTasksBatchRequestSchema = z.object({
  tasks: z.array(createTaskRequestSchema.omit({ action: true })).min(1).max(10),
  project: z.string().trim().min(1).max(200).optional(),
});
