import "server-only";

import { fetchActivityValues } from "@/lib/azure-devops/activity-values";
import { listTaskStates, type AdoWorkItemTypeState } from "@/lib/azure-devops/work-item-type-states";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import { findToolHandler, listToolDefinitions } from "@/lib/agent/tools/registry";
import { buildCreateTasksBatchDefinition, CREATE_TASKS_BATCH_TOOL_NAME } from "@/lib/agent/features/create-tasks/tool";
import type { ProgressCallback } from "@/lib/agent/orchestrator/run-feature";
import type { AgentProvider, ChatMessage, ConversationTurn } from "@/lib/agent/provider/provider.types";
import { previewResultSchema } from "@/lib/schemas/agent";
import type { PreviewResult } from "@/lib/schemas/agent";
import type { ToolExecutionContext } from "@/lib/agent/tools/types";

import { getTodayDateKey } from "@/lib/time-log/working-date-default";
import { buildTimeAgentSystemPrompt } from "./time-agent-prompt";
import { sanitizeUserInput } from "./input-sanitizer";
import {
  buildSelectionMessage,
  extractLastInteractiveQuestion,
  type PendingSelectionQuestion,
  resolveSelection,
} from "./selection-resolver";
import {
  executeIntermediateToolCall,
  INTERMEDIATE_TOOL_DEFINITIONS,
  INTERMEDIATE_TOOL_NAMES,
  LIST_WORK_ITEMS_NAME_FOR_DUAL_MODE,
  MAX_OBSERVATION_LOOPS,
  type DispatchDeps,
} from "./tool-dispatcher";

const MAX_ITERATIONS = 10;

const LIST_WORK_ITEMS_NAME = LIST_WORK_ITEMS_NAME_FOR_DUAL_MODE;

const ALWAYS_TERMINAL_TOOLS = new Set<string>([
  CREATE_TASKS_BATCH_TOOL_NAME,
  "needs_clarification",
  "question_with_options",
  "unsupported",
]);

function isListWorkItemsWithSummary(
  call: { name: string; arguments: unknown },
): boolean {
  if (call.name !== LIST_WORK_ITEMS_NAME) return false;
  if (typeof call.arguments !== "object" || call.arguments === null) return false;
  return "summary" in (call.arguments as Record<string, unknown>);
}

export type RunLogWorkArgs = {
  message: string;
  model: string;
  provider: AgentProvider;
  executionContext?: ToolExecutionContext;
  /**
   * Historial textual de turnos previos. NO incluye tool calls — para
   * detectar preguntas interactivas previas usa `lastAssistantToolCalls`.
   */
  history?: ConversationTurn[];
  /**
   * Lista cruda de tool calls del ÚLTIMO turno del assistant. Permite
   * al runner detectar si la pregunta anterior fue una
   * `question_with_options` o `needs_clarification` y resolver la
   * selección del usuario sin que el LLM tenga que parsear.
   */
  lastAssistantToolCalls?: ReadonlyArray<unknown>;
  onProgress?: ProgressCallback;
};

export async function runLogWorkFeature({
  message,
  model,
  provider,
  executionContext,
  history = [],
  lastAssistantToolCalls,
  onProgress,
}: RunLogWorkArgs): Promise<PreviewResult> {
  const sanitized = sanitizeUserInput(message);
  if (!sanitized) {
    return {
      action: "needs_clarification",
      question:
        "No detecté un mensaje legible. Escribe qué trabajo realizaste, en qué elemento y cuántas horas.",
    };
  }

  const auth = executionContext?.auth;
  const sprintPath = executionContext?.sprintContext?.sprintPath ?? "";
  const team = executionContext?.sprintContext?.team ?? "";
  const today = getTodayDateKey();

  const processProfile = auth ? await resolveProcessProfile(auth) : null;

  const [activityValues, taskStates] =
    auth && processProfile
      ? await Promise.all([
          fetchActivityValues(auth),
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
    ...INTERMEDIATE_TOOL_DEFINITIONS,
    ...listToolDefinitions().filter(
      (d) => d.name !== CREATE_TASKS_BATCH_TOOL_NAME && d.name !== "log_work_batch",
    ),
  ];

  // Detectar si el usuario está respondiendo a una pregunta interactiva
  // previa (`question_with_options` o `needs_clarification`). Si sí,
  // resolvemos la selección localmente y armamos un mensaje
  // estructurado que el LLM no puede malinterpretar.
  const pendingQuestion = extractPendingQuestion(lastAssistantToolCalls);
  const userMessageForLlm = buildUserMessageForLlm(
    sanitized,
    pendingQuestion,
    history,
  );

  let messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...userMessageForLlm,
  ];

  // Contador mutable de loops de Observation. Se pasa por referencia
  // en deps y se incrementa en `continueWithIntermediateResults`. Si
  // supera `MAX_OBSERVATION_LOOPS`, el runner lanza un error explícito
  // para forzar al LLM a cerrar el bucle. También tenemos un guard
  // duro en el loop principal como última línea de defensa.
  const observationCounter = { count: 0 };

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    // Guard duro: si llevamos más de 4 iteraciones sin cerrar,
    // forzamos el cierre con un error explícito. Esto atrapa casos
    // donde el loop detection de `continueWithIntermediateResults`
    // no se dispara (por ejemplo, si el LLM mezcla tools intermedias
    // y terminales de manera que confunde el contador).
    if (iteration > MAX_OBSERVATION_LOOPS + 1) {
      throw new Error(
        `Runner iteration limit reached (${iteration} iteraciones) — ` +
          `el LLM no cerró el bucle. Si estás en patrón B (análisis de sprint), ` +
          `DEBES llamar list_work_items CON summary en tu siguiente turno. ` +
          `En otros patrones, emite un create_tasks_batch, question_with_options ` +
          `o needs_clarification para terminar.`,
      );
    }

    const response = await provider.chat({
      model,
      temperature: 0.1,
      systemPrompt,
      messages,
      tools,
      toolChoice: "required",
    });

    const step = await processIterationResponse(response, {
      auth,
      sprintPath,
      executionContext,
      onProgress,
      messages,
      observationLoopCount: observationCounter.count,
    });

    if (step.kind === "terminal") {
      return step.preview;
    }

    messages = step.nextMessages;
    observationCounter.count = step.observationLoopCount;
  }

  throw new Error("El agente superó el número máximo de iteraciones.");
}

function extractPendingQuestion(
  rawToolCalls: ReadonlyArray<unknown> | undefined,
): PendingSelectionQuestion | null {
  if (!rawToolCalls || rawToolCalls.length === 0) return null;
  return extractLastInteractiveQuestion(
    rawToolCalls.map((tc) => ({
      role: "assistant",
      tool_calls: [tc],
    })),
  );
}

function buildUserMessageForLlm(
  sanitizedInput: string,
  pendingQuestion: PendingSelectionQuestion | null,
  history: ReadonlyArray<ConversationTurn>,
): ChatMessage[] {
  const base: ChatMessage[] = history.map((t) => ({
    role: t.role,
    content: t.content,
  }));

  if (!pendingQuestion) {
    return [...base, { role: "user", content: sanitizedInput }];
  }

  const resolved = resolveSelection(sanitizedInput, pendingQuestion);
  const matchedAny = resolved.matched.length > 0;

  if (!matchedAny) {
    // No había pregunta, o la pregunta era open-ended
    // (needs_clarification sin opciones). Pasamos el input tal cual
    // — el LLM lo procesa como texto libre.
    return [...base, { role: "user", content: sanitizedInput }];
  }

  // Habíamos preguntado algo con opciones y el input matchea al menos
  // una opción. El runner ya resolvió la selección — el LLM solo
  // recibe un mensaje estructurado que NO puede malinterpretar.
  const structured = buildSelectionMessage(sanitizedInput, pendingQuestion, resolved);
  return [...base, { role: "user", content: structured }];
}

function findDoneState(states: AdoWorkItemTypeState[]): string {
  return states.find((s) => s.category === "Completed")?.name ?? "Closed";
}

type IterationStep =
  | { kind: "terminal"; preview: PreviewResult }
  | { kind: "continue"; nextMessages: ChatMessage[]; observationLoopCount: number };

async function processIterationResponse(
  response: Awaited<ReturnType<AgentProvider["chat"]>>,
  deps: DispatchDeps,
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

type ToolCall = { id: string; name: string; arguments: unknown };

function splitToolCalls(toolCalls: ReadonlyArray<ToolCall>): {
  intermediateCalls: ToolCall[];
  terminalCall: ToolCall | undefined;
} {
  const intermediateCalls = toolCalls.filter(
    (c) =>
      INTERMEDIATE_TOOL_NAMES.has(c.name) ||
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
  terminalCall: ToolCall,
  deps: DispatchDeps,
): Promise<IterationStep> {
  if (terminalCall.name === CREATE_TASKS_BATCH_TOOL_NAME) {
    deps.onProgress?.({ kind: "logging", label: "Registrando tiempo…" });
  }
  const preview = await resolveTerminalToolCall(terminalCall, deps.executionContext);
  return { kind: "terminal", preview };
}

async function continueWithIntermediateResults(
  response: { rawToolCalls?: unknown },
  intermediateCalls: ReadonlyArray<{ id: string; name: string; arguments: unknown }>,
  terminalCall: { id: string } | undefined,
  deps: DispatchDeps,
): Promise<IterationStep> {
  const { auth, sprintPath, executionContext, onProgress, messages, observationLoopCount } =
    deps;

  // Loop detection: si el LLM lleva muchos turnos intermedios sin
  // cerrar con un terminal call, está atrapado. En vez de throw
  // (que el LLM nunca ve), retornamos un tool result que le ORDENA
  // explícitamente cerrar el bucle. El LLM ve este mensaje como
  // un tool result más y debe actuar en consecuencia.
  let nextCount = observationLoopCount;
  let loopGuardResult: string | null = null;
  if (intermediateCalls.length > 0) {
    nextCount += 1;
    if (nextCount > MAX_OBSERVATION_LOOPS) {
      loopGuardResult = JSON.stringify({
        error: "BUCLE_DETECTADO",
        mensaje:
          `Llevas ${nextCount} turnos intermedios sin cerrar el bucle. ` +
          `Tienes los datos del sprint. TU PRÓXIMA Y ÚNICA tool call debe ser ` +
          `list_work_items CON el campo summary (string no vacío, máximo 2000 chars) ` +
          `con tu análisis. Después de eso, el bucle termina y el usuario verá ` +
          `tu análisis. Si NO sabes qué analizar, usa un summary mínimo: ` +
          `"Análisis automático: no pude generar insights detallados, pero los ` +
          `datos del sprint están disponibles. Revisa la lista de items abajo."`,
        accion_requerida: "llamar list_work_items con summary no vacío",
      });
    }
  }

  const toolResults: ChatMessage[] = [];
  for (const call of intermediateCalls) {
    // Si estamos en loop guard, sobrescribimos el resultado del tool
    // call con el mensaje de loopGuardResult. Esto le da al LLM
    // una instrucción explícita en vez de seguir con el resultado
    // normal que lo invita a seguir llamando tools.
    if (loopGuardResult) {
      toolResults.push({
        role: "tool",
        tool_call_id: call.id,
        content: loopGuardResult,
      });
      continue;
    }
    const { resultJson } = await executeIntermediateToolCall(
      call,
      { auth, sprintPath, executionContext, onProgress, messages, observationLoopCount: nextCount },
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
    observationLoopCount: nextCount,
  };
}

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

async function resolveTerminalToolCall(
  call: ToolCall,
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
