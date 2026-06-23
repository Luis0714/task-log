import "server-only";

import { findToolHandler, listToolDefinitions } from "@/lib/agent/tools/registry";
import type { AgentProvider } from "@/lib/agent/provider/provider.types";
import { previewResultSchema } from "@/lib/schemas/agent";
import type { PreviewResult } from "@/lib/schemas/agent";

import { logWorkBatchTool } from "./tool";
import { LOG_WORK_SYSTEM_PROMPT } from "./prompt";

export type RunLogWorkArgs = {
  message: string;
  model: string;
  provider: AgentProvider;
  /** Sprint path for tools that scope queries to the current sprint (e.g.
   *  `list_work_items`). When provided, passed to every tool's execution
   *  context. */
  sprintPath?: string;
};

export async function runLogWorkFeature({
  message,
  model,
  provider,
  sprintPath,
}: RunLogWorkArgs): Promise<PreviewResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    return {
      action: "needs_clarification",
      question: "Escribe qué trabajo registraste, en qué elemento (ID) y cuántas horas.",
    };
  }

  const response = await provider.chat({
    model,
    temperature: 0.1,
    systemPrompt: LOG_WORK_SYSTEM_PROMPT,
    userMessage: trimmed,
    tools: [logWorkBatchTool.definition, ...listToolDefinitions()],
  });

  const preview = await resolvePreviewFromToolCall(response.toolCalls, sprintPath);
  const safe = previewResultSchema.safeParse(preview);
  if (safe.success) return safe.data;

  throw new Error("La IA devolvió una herramienta con argumentos inválidos.");
}

async function resolvePreviewFromToolCall(
  toolCalls: ReadonlyArray<{ id: string; name: string; arguments: unknown }> | undefined,
  sprintPath: string | undefined,
): Promise<PreviewResult> {
  if (!toolCalls || toolCalls.length === 0) {
    throw new Error("La IA no invocó ninguna herramienta.");
  }
  const call = toolCalls[0];
  if (!call) {
    throw new Error("La IA no invocó ninguna herramienta.");
  }
  const handler = findToolHandler(call.name);
  if (!handler) {
    throw new Error(`Herramienta desconocida: ${call.name}`);
  }
  const parsed = handler.argsSchema.safeParse(call.arguments);
  if (!parsed.success) {
    throw new Error(`Argumentos inválidos para ${call.name}.`);
  }
  const output = await Promise.resolve(
    handler.handle(parsed.data, {
      ...(sprintPath ? { sprintContext: { sprintPath } } : {}),
    }),
  );
  return handler.outputSchema.parse(output) as PreviewResult;
}