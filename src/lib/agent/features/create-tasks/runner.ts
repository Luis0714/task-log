import "server-only";

import { searchPbiByText, type PbiSearchHit } from "@/lib/azure-devops/search-pbi-by-text";
import { listWorkItemsForQuery } from "@/lib/azure-devops/list-work-items-for-query";
import { fetchPbiSummary } from "@/lib/azure-devops/fetch-pbi-summary";
import { findToolHandler, listToolDefinitions } from "@/lib/agent/tools/registry";
import {
  SEARCH_PBI_TOOL_NAME,
  buildSearchPbiTool,
} from "@/lib/agent/features/create-tasks/search-pbi-tool";
import type { ToolExecutionContext } from "@/lib/agent/tools/types";
import type { AgentProvider, ChatMessage, ConversationTurn } from "@/lib/agent/provider/provider.types";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { previewResultSchema } from "@/lib/schemas/agent";
import type { NeedsClarificationPayload, PreviewResult } from "@/lib/schemas/agent";

import { createTasksBatchTool } from "./tool";
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
}: RunCreateTasksArgs): Promise<PreviewResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    return {
      action: "needs_clarification",
      question:
        "Cuéntame qué trabajo hiciste, en qué días, cuántas horas y bajo qué PBI padre quieres crear las tasks.",
    };
  }

  const auth = executionContext?.auth;
  const systemPrompt = buildCreateTasksSystemPrompt(sprintContext);
  const searchPbiToolDef = buildSearchPbiTool({
    ...(executionContext ?? {}),
    sprintPath: sprintContext.sprintPath,
  }).definition;
  // Shared terminal tools (needs_clarification, unsupported, question_with_options,
  // list_work_items) come from the registry so the LLM can route every kind of
  // intent (register / create / ask / list).
  const tools = [
    createTasksBatchTool.definition,
    searchPbiToolDef,
    ...listToolDefinitions(),
  ];

  let messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: trimmed },
  ];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const response = await provider.chat({ model, temperature: 0.1, systemPrompt, messages, tools });

    if (!response.toolCalls?.length) {
      throw new Error("La IA no invocó ninguna herramienta.");
    }

    const terminalCall = response.toolCalls.find((c) => TERMINAL_TOOLS.has(c.name));
    if (terminalCall) {
      return await resolveTerminalToolCall(
        terminalCall,
        auth,
        { sprintPath: sprintContext.sprintPath },
      );
    }

    const toolResults: ChatMessage[] = [];
    let terminalFromSearch: PreviewResult | null = null;

    for (const call of response.toolCalls) {
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

    messages = [
      ...messages,
      { role: "assistant", content: null, tool_calls: response.rawToolCalls },
      ...toolResults,
    ];
  }

  throw new Error("El copiloto superó el número máximo de iteraciones.");
}

function extractNumericId(query: string): number | null {
  const match = /^[#\s]*(\d+)\s*$/.exec(query);
  if (!match) return null;
  const id = parseInt(match[1]!, 10);
  return isNaN(id) || id <= 0 ? null : id;
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

  // If the query is a bare numeric ID (e.g. "258439" or "#258439"), resolve
  // it directly via the work-item API instead of doing a text search that
  // would never match a title containing that number.
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
    return {
      kind: "tool_result",
      toolCallId: call.id,
      content: JSON.stringify({
        error: `No existe ninguna PBI con ID #${numericId} en este proyecto. Llama needs_clarification para pedirle al usuario el ID correcto.`,
      }),
    };
  }

  const hits = await searchPbiByText(auth, query, sprintPath);

  if (hits.length === 0) {
    const sprintItems = await listWorkItemsForQuery(
      { types: ["pbi"], sprintPath },
      auth,
    );
    if (sprintItems.ok && sprintItems.items.length > 0) {
      return {
        kind: "terminal",
        preview: {
          action: "needs_clarification",
          question: `No encontré ninguna PBI relacionada con "${query}". ¿Cuál de estas es la correcta?`,
          candidates: sprintItems.items.slice(0, 8).map((item) => ({
            id: item.id,
            title: item.title,
            ...(item.state ? { state: item.state } : {}),
          })),
        },
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
  sprintContext: { sprintPath: string },
): Promise<PreviewResult> | PreviewResult {
  const handler = findToolHandler(call.name);
  if (!handler) throw new Error(`Herramienta desconocida: ${call.name}`);

  const parsedArgs = handler.argsSchema.safeParse(call.arguments);
  if (!parsedArgs.success) {
    throw new Error(`Argumentos inválidos para ${call.name}: ${parsedArgs.error.message}`);
  }

  const result = handler.handle(parsedArgs.data, {
    ...(auth ? { auth } : {}),
    sprintContext,
  });
  // Some tools (e.g. list_work_items) are async — wait for them before
  // validating the output against the preview schema.
  return Promise.resolve(result).then((output) => {
    const safe = previewResultSchema.safeParse(output);
    if (!safe.success) {
      throw new Error(`La herramienta ${call.name} devolvió una respuesta inválida.`);
    }
    return safe.data;
  });
}
