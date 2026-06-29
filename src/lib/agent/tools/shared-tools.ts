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
  multiSelect: z.boolean().optional(),
});

export const needsClarificationTool: ToolHandler<
  z.infer<typeof needsClarificationArgsSchema>,
  NeedsClarificationPayload
> = {
  definition: {
    name: NEEDS_CLARIFICATION_NAME,
    strict: true,
    description:
      "Devuelve esta herramienta cuando necesitas una respuesta en TEXTO LIBRE del usuario (no hay candidatos ni opciones predefinidas que mostrar). Úsala para preguntas abiertas como '¿Qué trabajo realizaste?' o '¿Cuántas horas trabajaste en total?'. La UI muestra un campo de texto. SIEMPRE que tengas 2 o más candidatos concretos (work items del sprint, duraciones típicas, fechas), prefiere `question_with_options` — el usuario hace click en la opción correcta en vez de escribir a mano. Una sola pregunta por turno.",
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
      "Devuelve esta herramienta cuando el usuario debe ELEGIR entre 2 y 8 opciones predefinidas. La UI las renderiza como radio buttons clickeables (single-select por default) o checkboxes (si `multiSelect: true`) — el usuario hace click y la respuesta se envía automáticamente, sin escribir. Casos de uso típicos: (1) **work items del sprint** como candidatos (cuando el usuario no sabe el ID o el sistema ya los conoce vía get_my_work_items / search_pbi — el `label` debe incluir el ID y título para que el usuario identifique cuál es). USA `multiSelect: true` cuando el usuario puede trabajar en VARIOS items en una sola sesión de registro (ej. 'Hoy trabajé en 3 historias distintas') — la UI muestra checkboxes y el botón muestra el contador '(3)'. (2) duraciones típicas ('1h', '2h', '4h', '8h') para horas; (3) fechas relativas ('hoy', 'ayer', 'anteayer'); (4) tipos de trabajo. `id` en kebab-case estable, `label` legible. `value` opcional: si lo pasas, ese string se envía al agente cuando el usuario selecciona la opción (útil cuando `id` no es lo que necesitas en el siguiente turno, ej. el `value` es el workItemId numérico). En multiSelect, el agente recibe un string con los `value`s concatenados por coma (ej. '123,124,125') — debes hacer split(',') para parsear. `description` opcional aparece como texto secundario bajo el label. `allowFreeText: true` permite al usuario ignorar las opciones y escribir texto libre (ej. horas custom o IDs separados por coma). NUNCA uses `needs_clarification` cuando tienes candidatos concretos — el usuario prefiere clickar a escribir. MÁXIMO 8 opciones por pregunta (límite del schema).",
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
            "Lista de 2 a 8 opciones. `id` en kebab-case estable; `label` legible y conciso.",
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
        multiSelect: {
          type: "boolean",
          description:
            "Si true, la UI renderiza checkboxes (no radio buttons) y el usuario puede marcar varias opciones. El agente recibe los `value`s concatenados por coma (ej. '123,124,125'). Default false. Úsalo para work items cuando el usuario pudo haber trabajado en varios.",
        },
      },
      required: ["question", "options", "allowFreeText", "multiSelect"],
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
    multiSelect: z.boolean().default(false),
  }),
  handle: (args): QuestionWithOptionsPayload => ({
    action: "question_with_options",
    question: args.question,
    options: args.options.map((opt) => ({ id: opt.id, label: opt.label })),
    allowFreeText: args.allowFreeText,
    multiSelect: args.multiSelect ?? false,
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
  /**
   * Análisis razonado que el LLM incluye cuando ya observó los datos en
   * un turno previo. Su presencia cambia la semántica de la llamada:
   *   - SIN `summary`  → llamada INTERMEDIA (Observation): trae los datos
   *                      y los devuelve al LLM para que razone.
   *   - CON `summary`  → llamada TERMINAL (respuesta al usuario): trae
   *                      los datos + el análisis del LLM y se muestra
   *                      en la UI como `info_list` con resumen.
   * El runner decide el modo según la presencia de este campo.
   */
  summary: z.string().min(1).max(2000).optional(),
});

export const listWorkItemsTool: ToolHandler<
  z.infer<typeof listWorkItemsArgsSchema>,
  InfoListPayload | UnsupportedPayload
> = {
  definition: {
    name: LIST_WORK_ITEMS_NAME,
    description:
      "Devuelve esta herramienta cuando el usuario PREGUNTE por su backlog (no cuando quiera registrar o crear). Ejemplos: '¿qué PBIs tengo?', 'muéstrame mis bugs abiertos', '¿qué tareas tengo?'. SIEMPRE busca en el sprint activo actual — no necesitas especificar sprint. `assignedToMe: true` cuando el usuario dice 'tengo', 'mis', 'asignadas a mí'; omítelo cuando pregunte por todo el equipo. `types` filtra por tipo (pbi, bug, task); omite para todos. `states` solo cuando el usuario mencione un nombre de estado EXACTO de ADO (ej. 'estado Resolved'); para 'activas', 'abiertas', 'en curso', 'pendientes' OMITE `states` — el sistema ya excluye los eliminados. `title` es el encabezado visible de la lista. NO combines con create_tasks_batch ni log_work_batch.",
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
        summary: {
          type: "string",
          minLength: 1,
          maxLength: 2000,
          description:
            "Análisis razonado del LLM (ReAct Observation → conclusión). SOLO incluir cuando ya llamaste esta herramienta SIN summary en un turno previo y observaste los datos. Su presencia indica que esta llamada es TERMINAL (respuesta al usuario con análisis). El resumen se renderiza en la UI como un encabezado interpretativo sobre la lista.",
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
      summary: z.string().min(1).max(2000).optional(),
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
      ...(args.summary ? { summary: args.summary } : {}),
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