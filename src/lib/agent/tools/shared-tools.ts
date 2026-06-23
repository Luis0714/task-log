import { z } from "zod";

import { registerTool, type ToolHandler } from "@/lib/agent/tools/registry";
import type {
  InfoListPayload,
  NeedsClarificationPayload,
  QuestionWithOptionsPayload,
  UnsupportedPayload,
} from "@/lib/schemas/agent";
import { listWorkItemsForQuery } from "@/lib/azure-devops/list-work-items-for-query";

const NEEDS_CLARIFICATION_NAME = "needs_clarification";
const UNSUPPORTED_NAME = "unsupported";
const QUESTION_WITH_OPTIONS_NAME = "question_with_options";
const LIST_WORK_ITEMS_NAME = "list_work_items";

const needsClarificationArgsSchema = z.object({
  question: z.string().min(1).max(500),
});

const unsupportedArgsSchema = z.object({
  reason: z.string().min(1).max(500),
});

const questionWithOptionsArgsSchema = z.object({
  question: z.string().min(1).max(500),
  options: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        label: z.string().min(1).max(120),
      }),
    )
    .min(2)
    .max(8),
  allowFreeText: z.boolean(),
});

export const needsClarificationTool: ToolHandler<
  z.infer<typeof needsClarificationArgsSchema>,
  NeedsClarificationPayload
> = {
  definition: {
    name: NEEDS_CLARIFICATION_NAME,
    strict: true,
    description:
      "Devuelve esta herramienta cuando falta información esencial (work item ID, horas, descripción del trabajo) y la ambigüedad es sobre una PBI o épica concreta. Formula UNA pregunta concreta y breve. Para preguntas genéricas con opciones predefinidas (fechas, tipo de trabajo, formato), usa `question_with_options` en su lugar.",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          minLength: 1,
          maxLength: 500,
          description: "Pregunta breve pidiendo exactamente lo que falta.",
        },
      },
      required: ["question"],
      additionalProperties: false,
    },
  },
  argsSchema: needsClarificationArgsSchema,
  outputSchema: z.object({
    action: z.literal("needs_clarification"),
    question: z.string().min(1).max(500),
    candidates: z
      .array(
        z.object({
          id: z.number().int().positive(),
          title: z.string().min(1).max(500),
          state: z.string().min(1).max(100).optional(),
        }),
      )
      .min(1)
      .max(8)
      .optional(),
  }),
  handle: (args): NeedsClarificationPayload => ({
    action: "needs_clarification",
    question: args.question,
  }),
};

export const unsupportedTool: ToolHandler<
  z.infer<typeof unsupportedArgsSchema>,
  UnsupportedPayload
> = {
  definition: {
    name: UNSUPPORTED_NAME,
    strict: true,
    description:
      "Devuelve esta herramienta cuando la intención del usuario NO es registrar trabajo (charla general, preguntas, etc.). Indica brevemente por qué no aplica.",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          minLength: 1,
          maxLength: 500,
          description: "Razón breve por la que no aplica.",
        },
      },
      required: ["reason"],
      additionalProperties: false,
    },
  },
  argsSchema: unsupportedArgsSchema,
  outputSchema: z.object({
    action: z.literal("unsupported"),
    reason: z.string().min(1).max(500),
  }),
  handle: (args): UnsupportedPayload => ({
    action: "unsupported",
    reason: args.reason,
  }),
};

export const questionWithOptionsTool: ToolHandler<
  z.infer<typeof questionWithOptionsArgsSchema>,
  QuestionWithOptionsPayload
> = {
  definition: {
    name: QUESTION_WITH_OPTIONS_NAME,
    strict: true,
    description:
      "Devuelve esta herramienta cuando necesitas una decisión del usuario sobre algo que NO es una PBI: fechas relativas ('ayer o anteayer'), tipo de trabajo ('bug o mejora'), formato de unidades ('horas o puntos'), etc. La UI la renderiza como un selector de opciones tipo radio; el usuario puede hacer click en una opción (que se envía automáticamente) o seguir escribiendo texto libre si `allowFreeText` es true. Distínguela de `needs_clarification`: usa `needs_clarification` solo para candidatos PBI concretos. Una sola pregunta por turno; no la combines con `create_tasks_batch` o `log_work_batch` en la misma respuesta.",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "Pregunta breve que se mostrará al usuario.",
        },
        options: {
          type: "array",
          description:
            "Lista de 2 a 8 opciones excluyentes. `id` en kebab-case estable; `label` legible y conciso.",
          items: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "Identificador estable en kebab-case (ej. 'today', 'yesterday', 'bug', 'development'). Se envía al agente cuando el usuario selecciona esta opción.",
              },
              label: {
                type: "string",
                description: "Texto visible de la opción (legible, en el idioma del usuario).",
              },
            },
            required: ["id", "label"],
            additionalProperties: false,
          },
        },
        allowFreeText: {
          type: "boolean",
          description:
            "Si true, el usuario puede ignorar las opciones y escribir texto libre en su lugar.",
        },
      },
      required: ["question", "options", "allowFreeText"],
      additionalProperties: false,
    },
  },
  argsSchema: questionWithOptionsArgsSchema,
  outputSchema: z.object({
    action: z.literal("question_with_options"),
    question: z.string().min(1).max(500),
    options: z
      .array(
        z.object({
          id: z.string().min(1).max(80),
          label: z.string().min(1).max(120),
          value: z.string().min(1).max(500).optional(),
          description: z.string().max(300).optional(),
        }),
      )
      .min(2)
      .max(8),
    allowFreeText: z.boolean(),
  }),
  handle: (args): QuestionWithOptionsPayload => ({
    action: "question_with_options",
    question: args.question,
    options: args.options.map((opt) => ({ id: opt.id, label: opt.label })),
    allowFreeText: args.allowFreeText,
  }),
};

const listWorkItemsArgsSchema = z.object({
  types: z
    .array(z.enum(["pbi", "bug", "task"]))
    .min(1)
    .max(3)
    .optional(),
  states: z.array(z.string().min(1).max(80)).max(12).optional(),
  assignedToMe: z.boolean().optional(),
  title: z.string().min(1).max(200),
  groupBy: z.enum(["type", "state"]).optional(),
  emptyHint: z.string().max(300).optional(),
});

export const listWorkItemsTool: ToolHandler<
  z.infer<typeof listWorkItemsArgsSchema>,
  InfoListPayload | UnsupportedPayload
> = {
  definition: {
    name: LIST_WORK_ITEMS_NAME,
    description:
      "Devuelve esta herramienta cuando el usuario PREGUNTE por su backlog (no cuando quiera registrar o crear). Ejemplos: '¿qué PBIs tengo?', 'muéstrame mis bugs abiertos', '¿qué tareas hice ayer?'. La UI renderiza el resultado como una lista agrupada con links a cada elemento en Azure DevOps. `title` es el encabezado visible para la lista (ej. 'Tus PBIs activos en el sprint'). `types` filtra por tipo de work item (pbi, bug, task). `states` filtra por estado (ej. ['Active','New']). `assignedToMe` limita a los asignados al usuario actual. NO combines esta tool con create_tasks_batch o log_work_batch en la misma respuesta.",
    parameters: {
      type: "object",
      properties: {
        types: {
          type: "array",
          items: {
            type: "string",
            enum: ["pbi", "bug", "task"],
          },
          minItems: 1,
          maxItems: 3,
          description: "Tipos de work item a incluir en el resultado.",
        },
        states: {
          type: "array",
          items: { type: "string", minLength: 1, maxLength: 80 },
          maxItems: 12,
          description:
            "Estados a incluir (ej. ['Active', 'New']). Si se omite, devuelve cualquier estado.",
        },
        assignedToMe: {
          type: "boolean",
          description:
            "Si true, solo work items asignados al usuario actual (System.AssignedTo = @me).",
        },
        title: {
          type: "string",
          minLength: 1,
          maxLength: 200,
          description: "Encabezado visible de la lista (ej. 'Tus PBIs activos en el sprint').",
        },
        groupBy: {
          type: "string",
          enum: ["type", "state"],
          description:
            "Cómo agrupar los items visualmente. Default 'type' (PBIs / Bugs / Tasks separados).",
        },
        emptyHint: {
          type: "string",
          maxLength: 300,
          description:
            "Mensaje a mostrar si la consulta no devuelve resultados (ej. 'No tienes bugs activos en este sprint.').",
        },
      },
      required: ["title"],
      additionalProperties: false,
    },
  },
  argsSchema: listWorkItemsArgsSchema,
  outputSchema: z.union([
    z.object({
      action: z.literal("info_list"),
      title: z.string().min(1).max(200),
      items: z
        .array(
          z.object({
            id: z.number().int().positive(),
            type: z.enum(["pbi", "bug", "task"]),
            title: z.string().min(1).max(500),
            state: z.string().optional(),
            assignedTo: z.string().optional(),
            url: z.string().url().optional(),
          }),
        )
        .max(20),
      groupBy: z.enum(["type", "state"]),
      emptyHint: z.string().max(300).optional(),
    }),
    z.object({
      action: z.literal("unsupported"),
      reason: z.string().min(1).max(500),
    }),
  ]),
  handle: async (args, ctx): Promise<InfoListPayload | UnsupportedPayload> => {
    const sprintPath = (ctx as { sprintContext?: { sprintPath?: string } })
      .sprintContext?.sprintPath;
    const result = await listWorkItemsForQuery(
      {
        types: args.types ?? ["pbi", "bug", "task"],
        ...(args.states ? { states: args.states } : {}),
        ...(args.assignedToMe !== undefined ? { assignedToMe: args.assignedToMe } : {}),
        ...(sprintPath ? { sprintPath } : {}),
      },
      ctx.auth,
    );

    if (!result.ok) {
      return { action: "unsupported", reason: result.userMessage };
    }

    return {
      action: "info_list",
      title: args.title,
      items: result.items,
      groupBy: args.groupBy ?? "type",
      ...(args.emptyHint ? { emptyHint: args.emptyHint } : {}),
    };
  },
};

registerTool(needsClarificationTool);
registerTool(unsupportedTool);
registerTool(questionWithOptionsTool);
registerTool(listWorkItemsTool);

export const SHARED_TOOL_NAMES = [
  NEEDS_CLARIFICATION_NAME,
  UNSUPPORTED_NAME,
  QUESTION_WITH_OPTIONS_NAME,
  LIST_WORK_ITEMS_NAME,
] as const;