import "server-only";

import { findToolHandler } from "@/lib/agent/tools/registry";
import type { AgentProvider } from "@/lib/agent/provider/provider.types";
import { previewResultSchema } from "@/lib/schemas/agent";
import type { PreviewResult } from "@/lib/schemas/agent";

import { logWorkBatchTool } from "./tool";
import { LOG_WORK_SYSTEM_PROMPT } from "./prompt";

export type RunLogWorkArgs = {
  message: string;
  model: string;
  provider: AgentProvider;
};

export async function runLogWorkFeature({
  message,
  model,
  provider,
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
    tools: [logWorkBatchTool.definition],
  });

  const preview = resolvePreviewFromToolCall(response.toolCalls);
  const safe = previewResultSchema.safeParse(preview);
  if (safe.success) return safe.data;

  throw new Error("La IA devolvió una herramienta con argumentos inválidos.");
}

function resolvePreviewFromToolCall(
  toolCalls: ReadonlyArray<{ id: string; name: string; arguments: unknown }> | undefined,
): PreviewResult {
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
  const output = handler.handle(parsed.data, {});
  return handler.outputSchema.parse(output) as PreviewResult;
}