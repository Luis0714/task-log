import "server-only";

import { findToolHandler, listToolDefinitions } from "@/lib/agent/tools/registry";
import type { AgentProvider, ChatMessage, ConversationTurn } from "@/lib/agent/provider/provider.types";
import { previewResultSchema } from "@/lib/schemas/agent";
import type { PreviewResult } from "@/lib/schemas/agent";
import type { ToolExecutionContext } from "@/lib/agent/tools/types";

import { LOG_WORK_BATCH_TOOL_NAME } from "./tool";
import { TIME_AGENT_SYSTEM_PROMPT } from "./time-agent-prompt";
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

export type RunLogWorkArgs = {
  message: string;
  model: string;
  provider: AgentProvider;
  executionContext?: ToolExecutionContext;
  history?: ConversationTurn[];
};

const MAX_ITERATIONS = 10;

const TERMINAL_TOOLS = new Set([
  LOG_WORK_BATCH_TOOL_NAME,
  "needs_clarification",
  "question_with_options",
  "list_work_items",
  "unsupported",
]);

const INTERMEDIATE_TOOLS = new Set([
  SEARCH_WORK_ITEMS_TOOL_NAME,
  GET_MY_WORK_ITEMS_TOOL_NAME,
]);

export async function runLogWorkFeature({
  message,
  model,
  provider,
  executionContext,
  history = [],
}: RunLogWorkArgs): Promise<PreviewResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    return {
      action: "needs_clarification",
      question: "Escribe qué trabajo registraste, en qué elemento y cuántas horas.",
    };
  }

  const auth = executionContext?.auth;
  const sprintPath = executionContext?.sprintContext?.sprintPath;

  const tools = [
    SEARCH_WORK_ITEMS_TOOL_DEFINITION,
    GET_MY_WORK_ITEMS_TOOL_DEFINITION,
    ...listToolDefinitions(),
  ];

  let messages: ChatMessage[] = [
    { role: "system", content: TIME_AGENT_SYSTEM_PROMPT },
    ...history.map((t) => ({ role: t.role, content: t.content })),
    { role: "user", content: trimmed },
  ];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const response = await provider.chat({
      model,
      temperature: 0.1,
      systemPrompt: TIME_AGENT_SYSTEM_PROMPT,
      messages,
      tools,
    });

    if (!response.toolCalls?.length) {
      throw new Error("La IA no invocó ninguna herramienta.");
    }

    const intermediateCalls = response.toolCalls.filter((c) => INTERMEDIATE_TOOLS.has(c.name));
    const terminalCall = response.toolCalls.find((c) => TERMINAL_TOOLS.has(c.name));

    if (!terminalCall && intermediateCalls.length === 0) {
      const unknownName = response.toolCalls[0]?.name ?? "desconocida";
      throw new Error(`Herramienta desconocida: ${unknownName}`);
    }

    if (terminalCall && intermediateCalls.length === 0) {
      return await resolveTerminalToolCall(terminalCall, executionContext);
    }

    const toolResults: ChatMessage[] = [];

    for (const call of intermediateCalls) {
      let resultJson: string;

      if (call.name === SEARCH_WORK_ITEMS_TOOL_NAME) {
        const parsed = searchWorkItemsArgsSchema.safeParse(call.arguments);
        if (!parsed.success) {
          resultJson = JSON.stringify({ error: "Argumentos inválidos para search_work_items." });
        } else {
          const result = await handleSearchWorkItems(parsed.data, { auth, sprintPath });
          resultJson = JSON.stringify(result);
        }
      } else if (call.name === GET_MY_WORK_ITEMS_TOOL_NAME) {
        const parsed = getMyWorkItemsArgsSchema.safeParse(call.arguments);
        if (!parsed.success) {
          resultJson = JSON.stringify({ error: "Argumentos inválidos para get_my_work_items." });
        } else {
          const result = await handleGetMyWorkItems(parsed.data, { auth, sprintPath });
          resultJson = JSON.stringify(result);
        }
      } else {
        resultJson = JSON.stringify({ error: `Herramienta intermedia desconocida: ${call.name}` });
      }

      toolResults.push({ role: "tool", tool_call_id: call.id, content: resultJson });
    }

    messages = [
      ...messages,
      { role: "assistant", content: null, tool_calls: response.rawToolCalls },
      ...toolResults,
    ];
  }

  throw new Error("El agente superó el número máximo de iteraciones.");
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
