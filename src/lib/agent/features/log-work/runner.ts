import "server-only";

import { fetchTaskActivityValues } from "@/lib/azure-devops/fetch-task-activity-values";
import { listTaskStates, type AdoWorkItemTypeState } from "@/lib/azure-devops/work-item-type-states";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import { findToolHandler, listToolDefinitions } from "@/lib/agent/tools/registry";
import { buildCreateTasksBatchDefinition, CREATE_TASKS_BATCH_TOOL_NAME } from "@/lib/agent/features/create-tasks/tool";
import type { ProgressCallback } from "@/lib/agent/orchestrator/run-feature";
import type { AgentProvider, ChatMessage, ConversationTurn } from "@/lib/agent/provider/provider.types";
import { previewResultSchema } from "@/lib/schemas/agent";
import type { PreviewResult } from "@/lib/schemas/agent";
import type { ToolExecutionContext } from "@/lib/agent/tools/types";

import { buildTimeAgentSystemPrompt } from "./time-agent-prompt";
import {
  SEARCH_WORK_ITEMS_TOOL_NAME,
  SEARCH_WORK_ITEMS_TOOL_DEFINITION,
  handleSearchWorkItems,
  searchWorkItemsArgsSchema,
} from "./search-work-items-tool";
import {
  GET_MY_WORK_ITEMS_TOOL_NAME,
  GET_MY_WORK_ITEMS_TOOL_DEFINITION,
  handleGetMyWorkItems,
  getMyWorkItemsArgsSchema,
} from "./get-my-work-items-tool";
import {
  GET_MY_TEMPLATES_TOOL_NAME,
  GET_MY_TEMPLATES_TOOL_DEFINITION,
  handleGetMyTemplates,
  getMyTemplatesArgsSchema,
} from "./get-my-templates-tool";

export type RunLogWorkArgs = {
  message: string;
  model: string;
  provider: AgentProvider;
  executionContext?: ToolExecutionContext;
  history?: ConversationTurn[];
  onProgress?: ProgressCallback;
};

const MAX_ITERATIONS = 10;

const LIST_WORK_ITEMS_NAME = "list_work_items";

/**
 * `list_work_items` es **dual-mode** según el patrón ReAct:
 *  - SIN `summary` → INTERMEDIATE (Observation): trae los datos crudos
 *    y los devuelve al LLM para que razone antes de la respuesta final.
 *  - CON `summary` → TERMINAL (respuesta al usuario): trae los datos +
 *    el análisis razonado del LLM y se muestra en la UI con el resumen
 *    como encabezado interpretativo sobre la lista.
 *
 * El resto de herramientas son siempre terminales (devuelven el
 * `PreviewResult` final al usuario) o siempre intermedias (de Investigación).
 */
const ALWAYS_TERMINAL_TOOLS = new Set([
  CREATE_TASKS_BATCH_TOOL_NAME,
  "needs_clarification",
  "question_with_options",
  "unsupported",
]);

const INTERMEDIATE_TOOLS = new Set([
  SEARCH_WORK_ITEMS_TOOL_NAME,
  GET_MY_WORK_ITEMS_TOOL_NAME,
  GET_MY_TEMPLATES_TOOL_NAME,
]);

function isListWorkItemsWithSummary(
  call: { name: string; arguments: unknown },
): boolean {
  if (call.name !== LIST_WORK_ITEMS_NAME) return false;
  if (typeof call.arguments !== "object" || call.arguments === null) return false;
  return "summary" in (call.arguments as Record<string, unknown>);
}

function findDoneState(states: AdoWorkItemTypeState[]): string {
  return states.find((s) => s.category === "Completed")?.name ?? "Closed";
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

type IntermediateCall = { id: string; name: string; arguments: unknown };
type ExecuteDeps = {
  auth: ToolExecutionContext["auth"];
  sprintPath: string;
  executionContext: ToolExecutionContext | undefined;
  onProgress?: ProgressCallback;
  messages: ChatMessage[];
};

/**
 * Ejecuta UNA tool call intermedia y devuelve el JSON de resultado que
 * se inyecta como `tool` message en el siguiente turno. Encapsula la
 * rama if/else del runner principal para mantenerlo bajo el umbral de
 * complejidad cognitiva. Devuelve SIEMPRE un string (incluso en error),
 * porque OpenAI exige contenido en cada tool message.
 */
async function executeIntermediateToolCall(
  call: IntermediateCall,
  deps: ExecuteDeps,
): Promise<{ resultJson: string }> {
  const { auth, sprintPath, executionContext, onProgress } = deps;
  const errorResult = (msg: string) => ({ resultJson: JSON.stringify({ error: msg }) });

  // 1) search_work_items — historias por keyword
  if (call.name === SEARCH_WORK_ITEMS_TOOL_NAME) {
    const parsed = searchWorkItemsArgsSchema.safeParse(call.arguments);
    if (!parsed.success) return errorResult("Argumentos inválidos para search_work_items.");
    onProgress?.({ kind: "search", label: "Buscando historias…" });
    const result = await handleSearchWorkItems(parsed.data, { auth, sprintPath });
    const resultJson = JSON.stringify(result);
    const hits = countHits(resultJson);
    onProgress?.({
      kind: "found",
      label: hitsLabel(hits, "historia", "historias", "Historias consultadas."),
    });
    return { resultJson };
  }

  // 2) get_my_work_items — tareas asignadas al usuario
  if (call.name === GET_MY_WORK_ITEMS_TOOL_NAME) {
    const parsed = getMyWorkItemsArgsSchema.safeParse(call.arguments);
    if (!parsed.success) return errorResult("Argumentos inválidos para get_my_work_items.");
    onProgress?.({ kind: "search", label: "Buscando tareas…" });
    const result = await handleGetMyWorkItems(parsed.data, { auth, sprintPath });
    const resultJson = JSON.stringify(result);
    const hits = countHits(resultJson);
    onProgress?.({
      kind: "found",
      label: hitsLabel(hits, "tarea", "tareas", "Tareas consultadas."),
    });
    return { resultJson };
  }

  // 3) get_my_templates — plantillas reutilizables
  if (call.name === GET_MY_TEMPLATES_TOOL_NAME) {
    const parsed = getMyTemplatesArgsSchema.safeParse(call.arguments);
    if (!parsed.success) return errorResult("Argumentos inválidos para get_my_templates.");
    onProgress?.({ kind: "search", label: "Buscando plantillas…" });
    const result = await handleGetMyTemplates(parsed.data, {
      userId: executionContext?.userId,
      userRole: executionContext?.userRole ?? null,
    });
    onProgress?.({
      kind: "found",
      label: templatesLabel(result),
    });
    return { resultJson: JSON.stringify(result) };
  }

  // 4) list_work_items (modo Observation ReAct) — sin `summary`, trae
  //    los datos crudos para que el LLM razone antes del turno terminal.
  if (call.name === LIST_WORK_ITEMS_NAME) {
    const handler = findToolHandler(LIST_WORK_ITEMS_NAME);
    if (!handler) return errorResult("Tool list_work_items no registrada.");
    const parsed = handler.argsSchema.safeParse(call.arguments);
    if (!parsed.success) return errorResult("Argumentos inválidos para list_work_items.");
    onProgress?.({ kind: "search", label: "Consultando el sprint…" });
    const output = await Promise.resolve(
      handler.handle(parsed.data, executionContext ?? {}),
    );
    onProgress?.({
      kind: "found",
      label: "Datos del sprint listos para analizar.",
    });
    return { resultJson: JSON.stringify(output) };
  }

  return errorResult(`Herramienta intermedia desconocida: ${call.name}`);
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
 * Filtra los rawToolCalls para quedarse SOLO con los que vamos a
 * responder en este turno. Cuando el LLM agrupa una terminal call con
 * intermediate calls, omitimos la terminal del assistant message (la
 * dejamos para el próximo turno) para que cada tool_call_id tenga su
 * tool response — sin esto OpenAI devuelve 400.
 */
function filterRespondedRawToolCalls(
  rawToolCalls: unknown,
  terminalCall: { id: string } | undefined,
  intermediateCalls: ReadonlyArray<{ id: string }>,
): unknown {
  if (!Array.isArray(rawToolCalls)) return rawToolCalls;
  if (!terminalCall) return rawToolCalls;

  const rawList = rawToolCalls as Array<{ id?: unknown }>;
  return rawList.filter(
    (raw) =>
      typeof raw.id === "string" &&
      intermediateCalls.some((c) => c.id === raw.id),
  );
}

export async function runLogWorkFeature({
  message,
  model,
  provider,
  executionContext,
  history = [],
  onProgress,
}: RunLogWorkArgs): Promise<PreviewResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    return {
      action: "needs_clarification",
      question: "Escribe qué trabajo realizaste, en qué elemento y cuántas horas.",
    };
  }

  const auth = executionContext?.auth;
  const sprintPath = executionContext?.sprintContext?.sprintPath ?? "";
  const team = executionContext?.sprintContext?.team ?? "";
  const today = new Date().toISOString().slice(0, 10);

  const processProfile = auth ? await resolveProcessProfile(auth) : null;

  const [activityValues, taskStates] =
    auth && processProfile
      ? await Promise.all([
          fetchTaskActivityValues(
            auth,
            processProfile.taskWorkItemType,
            processProfile.activityField,
          ),
          listTaskStates(auth, processProfile.taskWorkItemType),
        ])
      : [[] as readonly string[], [] as AdoWorkItemTypeState[]];

  const taskStateNames = taskStates.map((s) => s.name);
  const doneState = findDoneState(taskStates);

  const createTasksBatchDef = buildCreateTasksBatchDefinition(activityValues, taskStateNames);

  const systemPrompt = buildTimeAgentSystemPrompt({
    today,
    sprintPath,
    team,
    doneState,
    activityValues,
  });

  const tools = [
    createTasksBatchDef,
    SEARCH_WORK_ITEMS_TOOL_DEFINITION,
    GET_MY_WORK_ITEMS_TOOL_DEFINITION,
    GET_MY_TEMPLATES_TOOL_DEFINITION,
    ...listToolDefinitions().filter(
      (d) => d.name !== CREATE_TASKS_BATCH_TOOL_NAME && d.name !== "log_work_batch",
    ),
  ];

  let messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: trimmed },
  ];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const response = await provider.chat({
      model,
      temperature: 0.1,
      systemPrompt,
      messages,
      tools,
      // Forzamos al LLM a emitir al menos una tool call en cada turno.
      // Sin esto, ante meta-requests (ej. "Registrar mis horas" sin
      // detalles) el LLM devuelve texto plano en vez de llamar
      // `needs_clarification`, y el runner lanza `no_tool_call`.
      // Con `required`, el LLM DEBE elegir una herramienta — ya sea
      // una intermedia (search/get/templates) o una terminal
      // (needs_clarification, create_tasks_batch, etc.).
      toolChoice: "required",
    });

    const step = await processIterationResponse(response, {
      auth,
      sprintPath,
      executionContext,
      onProgress,
      messages,
    });

    // Si la iteración devolvió un resultado terminal, terminamos el bucle.
    if (step.kind === "terminal") {
      return step.preview;
    }

    // Si no, seguimos iterando con los mensajes actualizados.
    messages = step.nextMessages;
  }

  throw new Error("El agente superó el número máximo de iteraciones.");
}

type IterationStep =
  | { kind: "terminal"; preview: PreviewResult }
  | { kind: "continue"; nextMessages: ChatMessage[] };

/**
 * Procesa UNA respuesta del LLM: separa las tool calls en intermedias
 * y terminales, ejecuta las intermedias, y devuelve o el resultado
 * terminal (si el LLM terminó) o los mensajes actualizados para el
 * próximo turno del bucle ReAct.
 */
async function processIterationResponse(
  response: Awaited<ReturnType<AgentProvider["chat"]>>,
  deps: ExecuteDeps,
): Promise<IterationStep> {
  if (!response.toolCalls?.length) {
    throw new Error("La IA no invocó ninguna herramienta.");
  }

  const { intermediateCalls, terminalCall } = splitToolCalls(response.toolCalls);

  if (noUsableCalls(intermediateCalls, terminalCall)) {
    const unknownName = response.toolCalls[0]?.name ?? "desconocida";
    throw new Error(`Herramienta desconocida: ${unknownName}`);
  }

  if (terminalCall && intermediateCalls.length === 0) {
    return await resolvePureTerminal(terminalCall, deps);
  }

  return await continueWithIntermediateResults(
    response,
    intermediateCalls,
    terminalCall,
    deps,
  );
}

function splitToolCalls(
  toolCalls: ReadonlyArray<{ id: string; name: string; arguments: unknown }>,
): {
  intermediateCalls: Array<{ id: string; name: string; arguments: unknown }>;
  terminalCall: { id: string; name: string; arguments: unknown } | undefined;
} {
  const intermediateCalls = toolCalls.filter(
    (c) =>
      INTERMEDIATE_TOOLS.has(c.name) ||
      (c.name === LIST_WORK_ITEMS_NAME && !isListWorkItemsWithSummary(c)),
  );
  const terminalCall = toolCalls.find(
    (c) => ALWAYS_TERMINAL_TOOLS.has(c.name) || isListWorkItemsWithSummary(c),
  );
  return { intermediateCalls, terminalCall };
}

function noUsableCalls(
  intermediateCalls: ReadonlyArray<unknown>,
  terminalCall: unknown,
): boolean {
  return !terminalCall && intermediateCalls.length === 0;
}

async function resolvePureTerminal(
  terminalCall: { id: string; name: string; arguments: unknown },
  deps: ExecuteDeps,
): Promise<IterationStep> {
  if (terminalCall.name === CREATE_TASKS_BATCH_TOOL_NAME) {
    deps.onProgress?.({ kind: "logging", label: "Registrando tiempo…" });
  }
  const preview = await resolveTerminalToolCall(terminalCall, deps.executionContext);
  return { kind: "terminal", preview };
}

async function continueWithIntermediateResults(
  response: { rawToolCalls?: unknown },
  intermediateCalls: ReadonlyArray<{ id: string }>,
  terminalCall: { id: string } | undefined,
  deps: ExecuteDeps,
): Promise<IterationStep> {
  const { auth, sprintPath, executionContext, onProgress, messages } = deps;
  const toolResults: ChatMessage[] = [];
  for (const call of intermediateCalls) {
    const { resultJson } = await executeIntermediateToolCall(
      call as IntermediateCall,
      { auth, sprintPath, executionContext, onProgress },
    );
    toolResults.push({ role: "tool", tool_call_id: call.id, content: resultJson });
  }

  const respondedRawToolCalls = filterRespondedRawToolCalls(
    response.rawToolCalls,
    terminalCall,
    intermediateCalls,
  );

  return {
    kind: "continue",
    nextMessages: [
      ...messages,
      { role: "assistant", content: null, tool_calls: respondedRawToolCalls },
      ...toolResults,
    ],
  };
}

async function resolveTerminalToolCall(
  call: { id: string; name: string; arguments: unknown },
  executionContext: ToolExecutionContext | undefined,
): Promise<PreviewResult> {
  const handler = findToolHandler(call.name);
  if (!handler) throw new Error(`Herramienta desconocida: ${call.name}`);

  const parsed = handler.argsSchema.safeParse(call.arguments);
  if (!parsed.success) {
    throw new Error(`Argumentos inválidos para ${call.name}: ${parsed.error.message}`);
  }

  const output = await Promise.resolve(
    handler.handle(parsed.data, executionContext ?? {}),
  );

  const safe = previewResultSchema.safeParse(output);
  if (!safe.success) {
    throw new Error(`La herramienta ${call.name} devolvió una respuesta inválida.`);
  }
  return safe.data;
}
