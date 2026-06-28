import "server-only";

import { z } from "zod";
import { searchPbiByText, type PbiSearchHit } from "@/lib/azure-devops/search-pbi-by-text";
import { listWorkItemsForQuery } from "@/lib/azure-devops/list-work-items-for-query";
import { fetchPbiSummary } from "@/lib/azure-devops/fetch-pbi-summary";
import { fetchTaskActivityValues } from "@/lib/azure-devops/fetch-task-activity-values";
import { listTaskStates, type AdoWorkItemTypeState } from "@/lib/azure-devops/work-item-type-states";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import { findToolHandler, listToolDefinitions } from "@/lib/agent/tools/registry";
import {
  SEARCH_PBI_TOOL_NAME,
  buildSearchPbiTool,
} from "@/lib/agent/features/create-tasks/search-pbi-tool";
import type { ToolExecutionContext } from "@/lib/agent/tools/types";
import type { ProgressCallback } from "@/lib/agent/orchestrator/run-feature";
import type { AgentProvider, ChatMessage, ConversationTurn } from "@/lib/agent/provider/provider.types";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { previewResultSchema, type PbiCandidate } from "@/lib/schemas/agent";
import type { NeedsClarificationPayload, PreviewResult } from "@/lib/schemas/agent";

import { buildCreateTasksBatchDefinition, CREATE_TASKS_BATCH_TOOL_NAME } from "./tool";
import { buildCreateTasksSystemPrompt } from "./prompt";

export type SprintContext = {
  project: string;
  team: string;
  sprintPath: string;
  sprintStartDate: string;
  sprintFinishDate: string;
  nonWorkingDates: readonly string[];
};

export type RunCreateTasksArgs = {
  message: string;
  model: string;
  provider: AgentProvider;
  sprintContext: SprintContext;
  executionContext?: ToolExecutionContext;
  history?: ConversationTurn[];
  userRole?: string;
  onProgress?: ProgressCallback;
};

const MAX_ITERATIONS = 8;
const TERMINAL_TOOLS = new Set([
  "create_tasks_batch",
  "log_work_batch",
  "needs_clarification",
  "unsupported",
  "question_with_options",
  "list_work_items",
]);

type SearchPbiResult =
  | { kind: "tool_result"; toolCallId: string; content: string }
  | { kind: "terminal"; preview: NeedsClarificationPayload };

export async function runCreateTasksFeature({
  message,
  model,
  provider,
  sprintContext,
  executionContext,
  history = [],
  userRole,
  onProgress,
}: RunCreateTasksArgs): Promise<PreviewResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    return {
      action: "needs_clarification",
      question:
        "Cuéntame qué trabajo hiciste, en qué días, cuántas horas y bajo qué PBI padre quieres crear las tasks.",
    };
  }

  // Surface an early "thinking" hint so the UI doesn't sit on an empty
  // spinner while we fetch process profile + activity values.
  onProgress?.({ kind: "thinking", label: "Analizando la solicitud…" });

  const auth = executionContext?.auth;

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

  const systemPrompt = buildCreateTasksSystemPrompt({
    ...sprintContext,
    activityValues,
    taskStateNames,
    doneState,
    userRole,
    today: new Date().toISOString().slice(0, 10),
  });

  const searchPbiToolDef = buildSearchPbiTool({
    ...(executionContext ?? {}),
    sprintPath: sprintContext.sprintPath,
  }).definition;

  const tools = [
    buildCreateTasksBatchDefinition(activityValues, taskStateNames),
    searchPbiToolDef,
    ...listToolDefinitions().filter((d) => d.name !== CREATE_TASKS_BATCH_TOOL_NAME),
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
      // Forzamos al LLM a emitir al menos una tool call por turno. Sin esto,
      // ante meta-requests (ej. "Crear tareas" sin detalles) el LLM devuelve
      // texto plano en vez de `needs_clarification` / `search_pbi`, y el
      // runner lanza `no_tool_call`.
      toolChoice: "required",
    });

    if (!response.toolCalls?.length) {
      throw new Error("La IA no invocó ninguna herramienta.");
    }

    const searchCalls = response.toolCalls.filter((c) => c.name === SEARCH_PBI_TOOL_NAME);
    const terminalCall = response.toolCalls.find((c) => TERMINAL_TOOLS.has(c.name));


    
    if (terminalCall && searchCalls.length === 0) {
      if (terminalCall.name === CREATE_TASKS_BATCH_TOOL_NAME && auth) {
        const guard = await guardPbiIds(terminalCall.arguments, auth, sprintContext.sprintPath);
        if (guard) return guard;
      }
      return await resolveTerminalToolCall(
        terminalCall,
        auth,
        { sprintPath: sprintContext.sprintPath },
      );
    }

    const toolResults: ChatMessage[] = [];
    let terminalFromSearch: PreviewResult | null = null;

    for (const call of searchCalls.length > 0 ? searchCalls : response.toolCalls) {
      if (call.name !== SEARCH_PBI_TOOL_NAME) {
        throw new Error(`Herramienta intermedia desconocida: ${call.name}`);
      }

      const result = await resolveSearchPbi(call, auth, sprintContext.sprintPath);

      if (result.kind === "terminal") {
        terminalFromSearch = result.preview;
        break;
      }

      toolResults.push({
        role: "tool",
        tool_call_id: result.toolCallId,
        content: result.content,
      });
    }

    if (terminalFromSearch) return terminalFromSearch;
    if (toolResults.length === 0) throw new Error("El loop agéntico no produjo resultados.");

    // When the LLM bundles search + terminal calls in the same turn we
    // only execute the searches this iteration and let the LLM re-invoke
    // the terminal in a subsequent turn with the gathered info. We must
    // omit the unexecuted terminal call from the assistant message so
    // every tool_call_id has a matching tool response — otherwise OpenAI
    // returns a 400 ("tool_calls must be followed by tool messages
    // responding to each tool_call_id").
    const rawToolCalls = Array.isArray(response.rawToolCalls)
      ? (response.rawToolCalls as Array<{ id?: unknown }>)
      : null;
    const respondedRawToolCalls =
      terminalCall && rawToolCalls
        ? rawToolCalls.filter(
            (raw) =>
              typeof raw.id === "string" &&
              toolResults.some((r) => r.tool_call_id === raw.id),
          )
        : response.rawToolCalls;

    messages = [
      ...messages,
      { role: "assistant", content: null, tool_calls: respondedRawToolCalls },
      ...toolResults,
    ];
  }

  throw new Error("El copiloto superó el número máximo de iteraciones.");
}

function findDoneState(states: AdoWorkItemTypeState[]): string {
  return states.find((s) => s.category === "Completed")?.name ?? "Closed";
}

const guardArgsSchema = z.object({
  tasks: z.array(z.object({ pbiId: z.number().int().positive() })).optional(),
});

async function guardPbiIds(
  args: unknown,
  auth: AdoCallerAuth,
  sprintPath: string,
): Promise<NeedsClarificationPayload | null> {
  const parsed = guardArgsSchema.safeParse(args);
  const tasks = parsed.success ? (parsed.data.tasks ?? []) : [];

  const uniqueIds = [...new Set(tasks.map((t) => t.pbiId))];

  for (const pbiId of uniqueIds) {
    const summary = await fetchPbiSummary(auth, pbiId);
    if (!summary.exists) {
      return toNeedsClarification(
        `La historia de usuario #${pbiId} no existe o no es accesible. ¿Cuál de estas es la correcta?`,
        await sprintPbiCandidates(auth, sprintPath),
      );
    }
  }

  return null;
}

async function sprintPbiCandidates(auth: AdoCallerAuth, sprintPath: string): Promise<PbiCandidate[]> {
  const result = await listWorkItemsForQuery({ types: ["pbi"], sprintPath }, auth);
  if (!result.ok) return [];
  return result.items.slice(0, 8).map((item) => ({
    id: item.id,
    title: item.title,
    ...(item.state ? { state: item.state } : {}),
  }));
}

function toNeedsClarification(question: string, candidates: PbiCandidate[]): NeedsClarificationPayload {
  return { action: "needs_clarification", question, candidates };
}

function extractNumericId(query: string): number | null {
  const trimmed = query.trim();

  // Caso 1: la query es solo un número (ej. "258439" o "#258439")
  const exact = /^[#\s]*(\d+)\s*$/.exec(trimmed);
  if (exact) {
    const id = parseInt(exact[1]!, 10);
    return isNaN(id) || id <= 0 ? null : id;
  }

  // Caso 2: número precedido por palabras clave comunes en español/inglés
  // Cubre: "historia de usuario 106", "HU 258", "PBI #400", "issue 99", "#301"
  const embedded =
    /(?:historia(?:\s+de\s+usuario)?|pbi|hu|tarea|issue|work\s*item)\s*#?\s*(\d+)|(?<!\d)#(\d+)(?!\d)/i.exec(
      trimmed,
    );
  if (embedded) {
    const raw = embedded[1] ?? embedded[2];
    const id = parseInt(raw!, 10);
    return isNaN(id) || id <= 0 ? null : id;
  }

  return null;
}

async function resolveSearchPbi(
  call: { id: string; arguments: unknown },
  auth: AdoCallerAuth | undefined,
  sprintPath: string,
): Promise<SearchPbiResult> {
  if (!auth) {
    return {
      kind: "terminal",
      preview: {
        action: "needs_clarification",
        question: "No hay conexión con Azure DevOps. Por favor inicia sesión e intenta de nuevo.",
        candidates: [],
      },
    };
  }

  const args = call.arguments as { query?: string };
  const query = typeof args.query === "string" ? args.query.trim() : "";

  if (!query) {
    return {
      kind: "tool_result",
      toolCallId: call.id,
      content: JSON.stringify({ error: "La query de búsqueda no puede estar vacía." }),
    };
  }

  // Try to resolve by numeric ADO ID first (fast, exact).
  // If the ID doesn't exist in ADO, fall through to text search — the user
  // may have written "HU 116" where 116 is a sequential title number (e.g.
  // "HU-116 – ...") rather than the actual ADO work-item ID (e.g. 258439).
  const numericId = extractNumericId(query);
  if (numericId !== null) {
    const summary = await fetchPbiSummary(auth, numericId);
    if (summary.exists && summary.title) {
      return {
        kind: "tool_result",
        toolCallId: call.id,
        content: JSON.stringify({ pbiId: numericId, pbiTitle: summary.title }),
      };
    }
    // ID not found — continue to text search with the original query.
  }

  const hits = await searchPbiByText(auth, query, sprintPath);

  if (hits.length === 0) {
    const candidates = await sprintPbiCandidates(auth, sprintPath);
    if (candidates.length > 0) {
      return {
        kind: "terminal",
        preview: toNeedsClarification(
          `No encontré ninguna PBI relacionada con "${query}". ¿Cuál de estas es la correcta?`,
          candidates,
        ),
      };
    }
    return {
      kind: "tool_result",
      toolCallId: call.id,
      content: JSON.stringify({
        error: `No encontré ninguna PBI con "${query}". Llama needs_clarification para pedirle al usuario el ID exacto.`,
      }),
    };
  }

  if (hits.length === 1) {
    const hit = hits[0]!;
    return {
      kind: "tool_result",
      toolCallId: call.id,
      content: JSON.stringify({ pbiId: hit.id, pbiTitle: hit.title }),
    };
  }

  return {
    kind: "terminal",
    preview: buildClarificationFromHits(hits, query),
  };
}

function buildClarificationFromHits(
  hits: PbiSearchHit[],
  query: string,
): NeedsClarificationPayload {
  return {
    action: "needs_clarification",
    question: `Encontré ${hits.length} PBIs que coinciden con "${query}". ¿Cuál es la correcta?`,
    candidates: hits.map((h) => ({ id: h.id, title: h.title, state: h.state })),
  };
}

function resolveTerminalToolCall(
  call: {
    id: string;
    name: string;
    arguments: unknown;
  },
  auth: AdoCallerAuth | undefined,
  sprintContext: { sprintPath: string; team?: string },
): Promise<PreviewResult> | PreviewResult {
  const handler = findToolHandler(call.name);
  if (!handler) throw new Error(`Herramienta desconocida: ${call.name}`);

  const parsedArgs = handler.argsSchema.safeParse(call.arguments);
  if (!parsedArgs.success) {
    console.error(
      `[agent] invalid_args for ${call.name}:`,
      JSON.stringify(parsedArgs.error.issues, null, 2),
      "\nraw args:",
      JSON.stringify(call.arguments, null, 2),
    );
    throw new Error(`Argumentos inválidos para ${call.name}: ${parsedArgs.error.message}`);
  }

  const result = handler.handle(parsedArgs.data, {
    ...(auth ? { auth } : {}),
    sprintContext,
  });
  return Promise.resolve(result).then((output) => {
    const safe = previewResultSchema.safeParse(output);
    if (!safe.success) {
      console.error(
        `[agent] schema_invalid for ${call.name} output:`,
        JSON.stringify(safe.error.issues, null, 2),
        "\noutput:",
        JSON.stringify(output, null, 2),
      );
      throw new Error(`La herramienta ${call.name} devolvió una respuesta inválida.`);
    }
    return safe.data;
  });
}
