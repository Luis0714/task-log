import { z } from "zod";

import { registerTool, type ToolHandler } from "@/lib/agent/tools/registry";
import type { CreateTasksBatch } from "@/lib/schemas/agent";

export const CREATE_TASKS_BATCH_TOOL_NAME = "create_tasks_batch";

const createTasksBatchArgsSchema = z.object({
  pbiId: z.number().int().positive(),
  pbiTitle: z.string().min(1).max(500),
  tasks: z
    .array(
      z.object({
        title: z.string().min(1).max(256),
        hours: z.number().positive().max(24),
        description: z.string().min(1).max(2000),
        activity: z.string().min(1).max(100),
        workingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        workingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
        state: z.string().min(1).max(100),
        markAsDone: z.boolean().optional().default(true),
        sprintPath: z.string().min(1).max(500),
        team: z.string().min(1).max(200),
      }),
    )
    .min(1)
    .max(10),
});

export const createTasksBatchTool: ToolHandler<
  z.infer<typeof createTasksBatchArgsSchema>,
  CreateTasksBatch
> = {
  definition: {
    name: CREATE_TASKS_BATCH_TOOL_NAME,
    description:
      "Crea N tasks nuevas bajo una PBI padre existente en el sprint activo, registra las horas trabajadas y las marca como Done. Usa esto cuando el usuario describe trabajo realizado en uno o varios días y quiere que NeosView cree las tasks en su nombre.",
    parameters: {
      type: "object",
      properties: {
        pbiId: {
          type: "integer",
          minimum: 1,
          description: "ID numérico de la PBI padre.",
        },
        pbiTitle: {
          type: "string",
          minLength: 1,
          maxLength: 500,
          description: "Título descriptivo de la PBI padre.",
        },
        tasks: {
          type: "array",
          minItems: 1,
          maxItems: 10,
          items: {
            type: "object",
            properties: {
              title: { type: "string", minLength: 1, maxLength: 256 },
              hours: { type: "number", exclusiveMinimum: 0, maximum: 24 },
              description: {
                type: "string",
                minLength: 1,
                maxLength: 2000,
                description: "Descripción del trabajo, en el idioma del usuario.",
              },
              activity: {
                type: "string",
                minLength: 1,
                maxLength: 100,
                description: "Tipo de actividad (ej. 'Development', 'QA').",
              },
              workingDate: {
                type: "string",
                pattern: "^\\d{4}-\\d{2}-\\d{2}$",
                description: "Fecha de trabajo en formato YYYY-MM-DD.",
              },
              workingTime: {
                type: "string",
                pattern: "^([01]\\d|2[0-3]):([0-5]\\d)$",
                description: "Hora en formato HH:mm 24h (default '09:00').",
              },
              state: {
                type: "string",
                minLength: 1,
                maxLength: 100,
                description: "Estado inicial de la task (normalmente 'Closed' si ya está hecha).",
              },
              markAsDone: {
                type: "boolean",
                description: "Si true, la task queda marcada como Done al crearla.",
              },
              sprintPath: {
                type: "string",
                minLength: 1,
                maxLength: 500,
                description: "Iteration path del sprint activo.",
              },
              team: {
                type: "string",
                minLength: 1,
                maxLength: 200,
                description: "Nombre del equipo.",
              },
            },
            required: [
              "title",
              "hours",
              "description",
              "activity",
              "workingDate",
              "workingTime",
              "state",
              "sprintPath",
              "team",
            ],
            additionalProperties: false,
          },
        },
      },
      required: ["pbiId", "pbiTitle", "tasks"],
      additionalProperties: false,
    },
  },
  argsSchema: createTasksBatchArgsSchema,
  outputSchema: z.object({
    action: z.literal("create_tasks_batch"),
    pbiId: z.number().int().positive(),
    pbiTitle: z.string().min(1).max(500),
    tasks: z.array(
      z.object({
        action: z.literal("create_task"),
        pbiId: z.number().int().positive(),
        pbiTitle: z.string().min(1).max(500),
        title: z.string().min(1).max(256),
        hours: z.number().positive().max(24),
        description: z.string().trim().min(1).max(2000),
        activity: z.string().min(1).max(100),
        workingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        workingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
        state: z.string().trim().min(1).max(100),
        markAsDone: z.boolean().optional().default(false),
        sprintPath: z.string().min(1).max(500),
        team: z.string().min(1).max(200),
      }),
    ).min(1).max(10),
  }),
  handle: (args): CreateTasksBatch => ({
    action: "create_tasks_batch",
    pbiId: args.pbiId,
    pbiTitle: args.pbiTitle,
    tasks: args.tasks.map((task) => ({
      action: "create_task" as const,
      pbiId: args.pbiId,
      pbiTitle: args.pbiTitle,
      title: task.title,
      hours: task.hours,
      description: task.description,
      activity: task.activity,
      workingDate: task.workingDate,
      workingTime: task.workingTime,
      state: task.state,
      markAsDone: task.markAsDone ?? true,
      sprintPath: task.sprintPath,
      team: task.team,
    })),
  }),
};

registerTool(createTasksBatchTool);