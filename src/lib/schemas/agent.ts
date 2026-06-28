import { z } from "zod";

import { WORKING_TIME_PATTERN } from "@/lib/date/ado-datetime";

export const previewActionSchema = z.enum([
  "log_work_batch",
  "create_tasks_batch",
  "needs_clarification",
  "unsupported",
  "question_with_options",
  "info_list",
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

/**
 * Valores canónicos del campo Activity para el proceso **Scrum** de Azure
 * DevOps (los defaults que muestra el portal al crear un proyecto nuevo).
 *
 * Esta lista se usa como:
 * 1. **Fallback** del hook `useTaskMeta` cuando la API
 *    `/api/copilot/task-meta` no responde o devuelve `[]` (ej. proyecto con
 *    proceso Basic sin campo Activity, permisos insuficientes, o respuesta
 *    con formato inesperado).
 * 2. **Tipo cerrado** (`TaskActivityValue`) para el plan del agente IA
 *    (`create-tasks`) — el LLM sólo puede proponer valores de esta lista.
 *
 * Si tu proyecto tiene una lista personalizada en Azure, los valores reales
 * llegan por la API y se usan en la UI; este fallback solo aparece cuando
 * esa llamada falla.
 */
export const TASK_ACTIVITY_VALUES = [
  "Deployment",
  "Design",
  "Development",
  "Documentation",
  "Management",
  "Requirements",
  "Testing",
  "Training",
] as const;

export type TaskActivityValue = typeof TASK_ACTIVITY_VALUES[number];

export const createTaskRequestSchema = z.object({
  action: z.literal("create_task"),
  pbiId: z.number().int().positive(),
  pbiTitle: z.string().min(1).max(500),
  title: z.string().min(1).max(256),
  hours: z.number().positive().max(24),
  description: z.string().trim().min(1).max(2000),
  activity: z.string().min(1).max(100).optional(),
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
  tasks: z.array(createTaskBatchItemSchema).min(1).max(20),
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

export const questionOptionSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().min(1).max(120),
  value: z.string().min(1).max(500).optional(),
  description: z.string().max(300).optional(),
});
export type QuestionOption = z.infer<typeof questionOptionSchema>;

export const questionWithOptionsPayloadSchema = z.object({
  action: z.literal("question_with_options"),
  question: z.string().min(1).max(500),
  options: z.array(questionOptionSchema).min(2).max(8),
  allowFreeText: z.boolean().default(true),
});
export type QuestionWithOptionsPayload = z.infer<
  typeof questionWithOptionsPayloadSchema
>;

export const infoListItemSchema = z.object({
  id: z.number().int().positive(),
  type: z.enum(["pbi", "bug", "task"]),
  title: z.string().min(1).max(500),
  state: z.string().optional(),
  assignedTo: z.string().optional(),
  url: z.string().url().optional(),
});
export type InfoListItem = z.infer<typeof infoListItemSchema>;

export const infoListPayloadSchema = z.object({
  action: z.literal("info_list"),
  title: z.string().min(1).max(200),
  items: z.array(infoListItemSchema).min(0).max(20),
  groupBy: z.enum(["type", "state"]).default("type"),
  emptyHint: z.string().max(300).optional(),
  /**
   * Análisis razonado del LLM (ReAct Observation → conclusión). Solo se
   * incluye cuando el LLM hace el ciclo completo: primero llama
   * `list_work_items` sin `summary` para ver los datos, y luego vuelve a
   * llamarlo CON `summary` para devolver el resultado analizado al usuario.
   * En ese caso, el `summary` aparece en la UI como un encabezado
   * interpretativo (no como lista de items otra vez).
   */
  summary: z.string().min(1).max(2000).optional(),
});
export type InfoListPayload = z.infer<typeof infoListPayloadSchema>;

export const previewResultSchema = z.discriminatedUnion("action", [
  logWorkBatchSchema,
  createTasksBatchSchema,
  needsClarificationPayloadSchema,
  unsupportedPayloadSchema,
  questionWithOptionsPayloadSchema,
  infoListPayloadSchema,
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
