import { z } from "zod";

import { registerTool, type ToolHandler } from "@/lib/agent/tools/registry";
import type { CreateTasksBatch } from "@/lib/schemas/agent";
import type { ToolDefinition } from "@/lib/agent/provider/provider.types";

export const CREATE_TASKS_BATCH_TOOL_NAME = "create_tasks_batch";

function parseHours(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v.replace(/[^\d.]/g, ""));
    return Number.isNaN(n) ? -1 : n;
  }
  return -1;
}

function parseDate(v: unknown): unknown {
  if (typeof v !== "string") return v;
  // Extract YYYY-MM-DD from ISO timestamps like "2026-06-22T00:00:00.000Z"
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(v);
  return match ? match[1] : v;
}

function parseTime(v: unknown): unknown {
  if (typeof v !== "string") return v;
  // Extract HH:mm from "09:00:00" or "09:00:00Z" etc.
  const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(v);
  return match ? match[0] : v;
}

function buildTaskItemSchema(activityRequired: boolean) {
  const baseShape = {
    pbiId: z.number().int().positive(),
    pbiTitle: z.string().min(1).max(500),
    title: z.string().min(1).max(256),
    hours: z.preprocess(parseHours, z.number().positive().max(24)),
    description: z.string().min(1).max(2000),
    activity: activityRequired
      ? z.string().min(1).max(100)
      : z.string().min(1).max(100).optional(),
    workingDate: z.preprocess(parseDate, z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    workingTime: z.preprocess(parseTime, z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/)),
    state: z.string().min(1).max(100),
    markAsDone: z.boolean(),
    sprintPath: z.string().min(1).max(500),
    team: z.string().min(1).max(200),
  };
  return z.object(baseShape);
}

function buildCreateTasksBatchArgsSchema(activityRequired: boolean) {
  return z.object({
    tasks: z.array(buildTaskItemSchema(activityRequired)).min(1).max(20),
  });
}

// The fallback schema (used for runtime validation in resolveTerminalToolCall)
// always treats activity as optional — the dynamic JSON schema sent to OpenAI
// already guides the model to include it when the project requires it.
const FALLBACK_ARGS_SCHEMA = buildCreateTasksBatchArgsSchema(false);

export function buildCreateTasksBatchDefinition(
  activityValues: readonly string[],
  stateNames: readonly string[],
): ToolDefinition {
  const activityRequired = activityValues.length > 0;
  const activityEnum = activityRequired ? activityValues : [];

  const stateSchema: Record<string, unknown> =
    stateNames.length > 0
      ? { type: "string", enum: stateNames, description: "Estado de la task al crearla." }
      : { type: "string", minLength: 1, maxLength: 100, description: "Estado de la task al crearla." };

  const activityJsonSchema: Record<string, unknown> = activityRequired
    ? {
        type: "string",
        enum: [...activityEnum],
        description: `Tipo de actividad. Valores permitidos: ${activityEnum.join(", ")}.`,
      }
    : {
        type: "string",
        description:
          "Opcional. Tipo de actividad. Omite este campo si el proyecto no tiene el campo Activity (proceso Basic).",
      };

  const baseItemProperties: Record<string, unknown> = {
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
    state: stateSchema,
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
  };

  // activity se omite completamente si el proyecto no tiene el campo Activity
  // (proceso Basic). Con strict:true, una propiedad en `properties` que NO esté
  // en `required` hace que OpenAI rechace el schema con 400.
  const itemProperties = activityRequired
    ? { ...baseItemProperties, activity: activityJsonSchema }
    : baseItemProperties;

  const requiredFields = [
    "pbiId",
    "pbiTitle",
    "title",
    "hours",
    "description",
    "workingDate",
    "workingTime",
    "state",
    "markAsDone",
    "sprintPath",
    "team",
  ];
  if (activityRequired) requiredFields.push("activity");

  return {
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
            properties: itemProperties,
            required: requiredFields,
            additionalProperties: false,
          },
        },
      },
      required: ["tasks"],
      additionalProperties: false,
    },
  };
}

export const createTasksBatchTool: ToolHandler<
  z.infer<typeof FALLBACK_ARGS_SCHEMA>,
  CreateTasksBatch
> = {
  definition: buildCreateTasksBatchDefinition([], []),
  argsSchema: FALLBACK_ARGS_SCHEMA,
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
        activity: z.string().min(1).max(100).optional(),
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
      ...(task.activity ? { activity: task.activity } : {}),
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
