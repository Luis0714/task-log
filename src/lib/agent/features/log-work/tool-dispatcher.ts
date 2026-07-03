import "server-only";

import { findToolHandler } from "@/lib/agent/tools/registry";
import type { ProgressCallback } from "@/lib/agent/orchestrator/run-feature";
import type { ChatMessage } from "@/lib/agent/provider/provider.types";
import type { ToolExecutionContext } from "@/lib/agent/tools/types";

import {
  GET_MY_TEMPLATES_TOOL_NAME,
  GET_MY_TEMPLATES_TOOL_DEFINITION,
  handleGetMyTemplates,
  getMyTemplatesArgsSchema,
} from "./get-my-templates-tool";
import {
  GET_MY_WORK_ITEMS_TOOL_NAME,
  GET_MY_WORK_ITEMS_TOOL_DEFINITION,
  handleGetMyWorkItems,
  getMyWorkItemsArgsSchema,
} from "./get-my-work-items-tool";
import {
  SEARCH_WORK_ITEMS_TOOL_NAME,
  SEARCH_WORK_ITEMS_TOOL_DEFINITION,
  handleSearchWorkItems,
  searchWorkItemsArgsSchema,
} from "./search-work-items-tool";

const LIST_WORK_ITEMS_NAME = "list_work_items";

export const INTERMEDIATE_TOOL_DEFINITIONS = [
  SEARCH_WORK_ITEMS_TOOL_DEFINITION,
  GET_MY_WORK_ITEMS_TOOL_DEFINITION,
  GET_MY_TEMPLATES_TOOL_DEFINITION,
] as const;

export const INTERMEDIATE_TOOL_NAMES = new Set<string>([
  SEARCH_WORK_ITEMS_TOOL_NAME,
  GET_MY_WORK_ITEMS_TOOL_NAME,
  GET_MY_TEMPLATES_TOOL_NAME,
  LIST_WORK_ITEMS_NAME,
]);

export const LIST_WORK_ITEMS_NAME_FOR_DUAL_MODE = LIST_WORK_ITEMS_NAME;

export type IntermediateCall = {
  id: string;
  name: string;
  arguments: unknown;
};

export type DispatchDeps = {
  auth: ToolExecutionContext["auth"];
  sprintPath: string;
  executionContext: ToolExecutionContext | undefined;
  onProgress?: ProgressCallback;
  /**
   * Mensajes acumulados hasta el turno actual. Necesario para que
   * `continueWithIntermediateResults` pueda construir el `nextMessages`
   * del bucle (extiende `messages` con el turno assistant + tool results).
   */
  messages: ChatMessage[];
  /**
   * Contador mutable de iteraciones consecutivas donde el LLM llamó
   * `list_work_items` SIN summary (modo Observation). Se incrementa
   * cada vez que el LLM re-llama sin avanzar al terminal. Cuando
   * supera `MAX_OBSERVATION_LOOPS`, el runner lanza un error
   * explícito para romper el loop. Vive en `DispatchDeps` para
   * persistir entre llamadas a `continueWithIntermediateResults`.
   */
  observationLoopCount: number;
};

export const MAX_OBSERVATION_LOOPS = 2;

/**
 * Ejecuta UNA tool call intermedia y devuelve el JSON de resultado
 * que se inyecta como mensaje `tool` en el siguiente turno. Cada
 * herramienta tiene su propia rama de validación + ejecución +
 * progress; este dispatcher las centraliza para mantener el runner
 * enfocado en el bucle ReAct.
 *
 * El resultado SIEMPRE es un string (incluso en error) porque OpenAI
 * exige contenido en cada tool message.
 */
export async function executeIntermediateToolCall(
  call: IntermediateCall,
  deps: DispatchDeps,
): Promise<{ resultJson: string }> {
  const { auth, sprintPath, executionContext, onProgress } = deps;
  const errorResult = (msg: string) => ({ resultJson: JSON.stringify({ error: msg }) });

  if (call.name === SEARCH_WORK_ITEMS_TOOL_NAME) {
    return runSearchWorkItems(call, { auth, sprintPath, onProgress }, errorResult);
  }

  if (call.name === GET_MY_WORK_ITEMS_TOOL_NAME) {
    return runGetMyWorkItems(call, { auth, sprintPath, onProgress }, errorResult);
  }

  if (call.name === GET_MY_TEMPLATES_TOOL_NAME) {
    return runGetMyTemplates(
      call,
      { executionContext, onProgress },
      errorResult,
    );
  }

  if (call.name === LIST_WORK_ITEMS_NAME) {
    return runListWorkItemsObservation(call, { executionContext, onProgress }, errorResult);
  }

  return errorResult(`Herramienta intermedia desconocida: ${call.name}`);
}

type ErrFactory = (msg: string) => { resultJson: string };

async function runSearchWorkItems(
  call: IntermediateCall,
  ctx: { auth: ToolExecutionContext["auth"]; sprintPath: string; onProgress?: ProgressCallback },
  errorResult: ErrFactory,
): Promise<{ resultJson: string }> {
  const parsed = searchWorkItemsArgsSchema.safeParse(call.arguments);
  if (!parsed.success) return errorResult("Argumentos inválidos para search_work_items.");
  ctx.onProgress?.({ kind: "search", label: "Buscando historias…" });
  const result = await handleSearchWorkItems(parsed.data, {
    auth: ctx.auth,
    sprintPath: ctx.sprintPath,
  });
  const resultJson = JSON.stringify(result);
  const hits = countHits(resultJson);
  ctx.onProgress?.({
    kind: "found",
    label: hitsLabel(hits, "historia", "historias", "Historias consultadas."),
  });
  // Enriquece: el LLM ahora ve un reminder explícito
  return { resultJson: enrichWithReminder(resultJson, SEARCH_WORK_ITEMS_TOOL_NAME) };
}

async function runGetMyWorkItems(
  call: IntermediateCall,
  ctx: { auth: ToolExecutionContext["auth"]; sprintPath: string; onProgress?: ProgressCallback },
  errorResult: ErrFactory,
): Promise<{ resultJson: string }> {
  const parsed = getMyWorkItemsArgsSchema.safeParse(call.arguments);
  if (!parsed.success) return errorResult("Argumentos inválidos para get_my_work_items.");
  ctx.onProgress?.({ kind: "search", label: "Buscando tareas…" });
  const result = await handleGetMyWorkItems(parsed.data, {
    auth: ctx.auth,
    sprintPath: ctx.sprintPath,
  });
  const resultJson = JSON.stringify(result);
  const hits = countHits(resultJson);
  ctx.onProgress?.({
    kind: "found",
    label: hitsLabel(hits, "tarea", "tareas", "Tareas consultadas."),
  });
  return { resultJson: enrichWithReminder(resultJson, GET_MY_WORK_ITEMS_TOOL_NAME) };
}

async function runGetMyTemplates(
  call: IntermediateCall,
  ctx: { executionContext: ToolExecutionContext | undefined; onProgress?: ProgressCallback },
  errorResult: ErrFactory,
): Promise<{ resultJson: string }> {
  const parsed = getMyTemplatesArgsSchema.safeParse(call.arguments);
  if (!parsed.success) return errorResult("Argumentos inválidos para get_my_templates.");
  ctx.onProgress?.({ kind: "search", label: "Buscando plantillas…" });
  const result = await handleGetMyTemplates(parsed.data, {
    userId: ctx.executionContext?.userId,
    userRole: ctx.executionContext?.userRole ?? null,
  });
  ctx.onProgress?.({
    kind: "found",
    label: templatesLabel(result),
  });
  return { resultJson: enrichWithReminder(JSON.stringify(result), GET_MY_TEMPLATES_TOOL_NAME) };
}

async function runListWorkItemsObservation(
  call: IntermediateCall,
  ctx: { executionContext: ToolExecutionContext | undefined; onProgress?: ProgressCallback },
  errorResult: ErrFactory,
): Promise<{ resultJson: string }> {
  const handler = findToolHandler(LIST_WORK_ITEMS_NAME);
  if (!handler) return errorResult("Tool list_work_items no registrada.");
  const parsed = handler.argsSchema.safeParse(call.arguments);
  if (!parsed.success) return errorResult("Argumentos inválidos para list_work_items.");
  ctx.onProgress?.({ kind: "search", label: "Consultando el sprint…" });
  const output = await Promise.resolve(
    handler.handle(parsed.data, ctx.executionContext ?? {}),
  );
  ctx.onProgress?.({ kind: "found", label: "Datos del sprint listos para analizar." });
  return { resultJson: enrichWithReminder(JSON.stringify(output), LIST_WORK_ITEMS_NAME) };
}

function countHits(rawResultJson: string): number | null {
  try {
    const parsed = JSON.parse(rawResultJson) as { items?: unknown[] };
    if (Array.isArray(parsed.items)) return parsed.items.length;
  } catch {
    /* ignore — non-JSON tool output */
  }
  return null;
}

function hitsLabel(
  hits: number | null,
  singular: string,
  plural: string,
  fallback: string,
): string {
  if (hits === null) return fallback;
  if (hits === 0) return `No encontré ${plural}.`;
  return `Encontré ${hits} ${hits === 1 ? singular : plural}.`;
}

type TemplatesResult = { error?: string; count?: number };
function templatesLabel(result: TemplatesResult): string {
  if (result.error) return "No pude cargar las plantillas.";
  if (result.count === 0) return "Sin plantillas guardadas.";
  return `Encontré ${result.count} ${result.count === 1 ? "plantilla" : "plantillas"}.`;
}

/**
 * Enriquece el resultado de un tool intermedio con un reminder
 * explícito para el LLM. Esto es la principal defensa contra el bug
 * recurrente donde el LLM re-llama search_work_items / get_my_work_items
 * con IDs que ya tiene en su Observation previa.
 */
function enrichWithReminder(resultJson: string, toolName: string): string {
  let reminder: string;
  switch (toolName) {
    case "get_my_work_items":
      reminder =
        "REMINDER: Estos son los work items ASIGNADOS AL USUARIO en el sprint activo. " +
        "Son tus CANDIDATOS para selección. Si el usuario te responde con uno o varios de " +
        "estos IDs, úsalos DIRECTAMENTE en el siguiente tool call (create_tasks_batch, " +
        "question_with_options, etc.) — NO vuelvas a llamar get_my_work_items ni " +
        "search_work_items para \"verificar\". Los IDs ya están aquí.";
      break;
    case "search_work_items":
      reminder =
        "REMINDER: Estos son los work items ENCONTRADOS por tu búsqueda. " +
        "Son tus CANDIDATOS para selección. Si el usuario te responde con uno o varios de " +
        "estos IDs, úsalos DIRECTAMENTE — NO vuelvas a llamar search_work_items para " +
        "buscar el mismo término otra vez.";
      break;
    case "get_my_templates":
      reminder =
        "REMINDER: Estas son las PLANTILLAS del usuario. Úsalas como inspiración " +
        "interna para autollenar title/description/activity/hours de las tasks que " +
        "propongas, pero NO insertes el contenido en la respuesta.";
      break;
    case "list_work_items":
      reminder =
        "REMINDER: Estos son los items del sprint. Si vas a hacer un ANÁLISIS, " +
        "tu siguiente turno debe ser list_work_items CON summary (terminal + análisis). " +
        "Si solo necesitas mostrarlos, ya puedes cerrar el bucle con la respuesta " +
        "al usuario. NO llames list_work_items de nuevo sin haber razonado primero.";
      break;
    default:
      return resultJson;
  }
  // Insertamos el reminder como una segunda línea — OpenAI espera un
  // string por tool message, así que lo concatenamos.
  return `${resultJson}\n\n---\n${reminder}`;
}
