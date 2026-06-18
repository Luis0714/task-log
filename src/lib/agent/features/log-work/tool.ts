import { z } from "zod";

import { registerTool, type ToolHandler } from "@/lib/agent/tools/registry";
import { logWorkItemSchema } from "@/lib/schemas/agent";
import type { LogWorkBatch } from "@/lib/schemas/agent";

export const LOG_WORK_BATCH_TOOL_NAME = "log_work_batch";

const logWorkItemArgsSchema = logWorkItemSchema.omit({ action: true });
const logWorkBatchArgsSchema = z.object({
  items: z.array(logWorkItemArgsSchema).min(1).max(10),
});

export const logWorkBatchTool: ToolHandler<
  z.infer<typeof logWorkBatchArgsSchema>,
  LogWorkBatch
> = {
  definition: {
    name: LOG_WORK_BATCH_TOOL_NAME,
    description:
      "Registra horas de trabajo en uno o varios elementos de trabajo (work items) existentes de Azure DevOps. Usa esto cuando el usuario reporta horas sobre tareas que ya existen y quiere que NeosView las vuelque en su nombre.",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          minItems: 1,
          maxItems: 10,
          items: {
            type: "object",
            properties: {
              workItemId: {
                type: "integer",
                minimum: 1,
                description:
                  "ID numérico del work item. Acepta formatos como 'US-123', 'AB-7', 'WI 99', '#456'.",
              },
              hours: {
                type: "number",
                exclusiveMinimum: 0,
                maximum: 24,
                description:
                  "Horas trabajadas (decimal permitido, ej. 1.5). 'media hora' = 0.5.",
              },
              comment: {
                type: "string",
                minLength: 1,
                maxLength: 2000,
                description:
                  "Descripción breve del trabajo realizado, en el idioma del usuario.",
              },
            },
            required: ["workItemId", "hours", "comment"],
            additionalProperties: false,
          },
        },
      },
      required: ["items"],
      additionalProperties: false,
    },
  },
  argsSchema: logWorkBatchArgsSchema,
  outputSchema: z.object({
    action: z.literal("log_work_batch"),
    items: z.array(logWorkItemSchema).min(1).max(10),
  }),
  handle: (args): LogWorkBatch => ({
    action: "log_work_batch",
    items: args.items.map((item) => ({
      action: "log_work" as const,
      workItemId: item.workItemId,
      hours: item.hours,
      comment: item.comment,
    })),
  }),
};

registerTool(logWorkBatchTool);