import { z } from "zod";

import { registerTool, type ToolHandler } from "@/lib/agent/tools/registry";
import type { CreateTasksBatch } from "@/lib/schemas/agent";

export const CREATE_TASKS_BATCH_TOOL_NAME = "create_tasks_batch";

const taskItemSchema = z.object({
  pbiId: z.number().int().positive(),
  pbiTitle: z.string().min(1).max(500),
  title: z.string().min(1).max(256),
  hours: z.number().positive().max(24),
  description: z.string().min(1).max(2000),
  activity: z.string().min(1).max(100),
  workingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  workingTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  state: z.string().min(1).max(100),
  markAsDone: z.boolean(),
  sprintPath: z.string().min(1).max(500),
  team: z.string().min(1).max(200),
});

const createTasksBatchArgsSchema = z.object({
  tasks: z.array(taskItemSchema).min(1).max(20),
});

export const createTasksBatchTool: ToolHandler<
  z.infer<typeof createTasksBatchArgsSchema>,
  CreateTasksBatch
> = {
  definition: {
    name: CREATE_TASKS_BATCH_TOOL_NAME,
    strict: true,
    description:
      "Crea tasks nuevas bajo una o varias PBIs existentes en el sprint activo, registra las horas trabajadas y las marca como Done. Soporta múltiples PBIs en un solo llamado: cada task lleva su propio pbiId y pbiTitle. Úsala cuando ya tengas todos los IDs de PBI confirmados y quieras proponer el lote completo.",
    parameters: {
      type: "object",
      properties: {
        tasks: {
          type: "array",
          minItems: 1,
          maxItems: 20,
          description: "Lista de tasks a crear. Cada una lleva el pbiId de su PBI padre.",
          items: {
            type: "object",
            properties: {
              pbiId: {
                type: "integer",
                minimum: 1,
                description: "ID numérico de la PBI padre de esta task.",
              },
              pbiTitle: {
                type: "string",
                minLength: 1,
                maxLength: 500,
                description: "Título de la PBI padre.",
              },
              title: { type: "string", minLength: 1, maxLength: 256 },
              hours: { type: "number", exclusiveMinimum: 0, maximum: 24 },
              description: {
                type: "string",
                minLength: 1,
                maxLength: 2000,
                description: "Descripción del trabajo realizado, en el idioma del usuario.",
              },
              activity: {
                type: "string",
                minLength: 1,
                maxLength: 100,
                description: "Tipo de actividad (ej. 'Development', 'Design', 'Requirements', 'Testing', 'Management').",
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
                description: "Estado inicial de la task (normalmente el estado Done del proceso).",
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
              "pbiId",
              "pbiTitle",
              "title",
              "hours",
              "description",
              "activity",
              "workingDate",
              "workingTime",
              "state",
              "markAsDone",
              "sprintPath",
              "team",
            ],
            additionalProperties: false,
          },
        },
      },
      required: ["tasks"],
      additionalProperties: false,
    },
  },
  argsSchema: createTasksBatchArgsSchema,
  outputSchema: z.object({
    action: z.literal("create_tasks_batch"),
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
    ).min(1).max(20),
  }),
  handle: (args): CreateTasksBatch => ({
    action: "create_tasks_batch",
    tasks: args.tasks.map((task) => ({
      action: "create_task" as const,
      pbiId: task.pbiId,
      pbiTitle: task.pbiTitle,
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
