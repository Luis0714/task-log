import "server-only";

import { z } from "zod";

import type { AgentProvider, ConversationTurn } from "@/lib/agent/provider/provider.types";
import { ROUTER_SYSTEM_PROMPT } from "@/lib/agent/orchestrator/router-prompt";

export type RouterIntent = "time_registration" | "work_item_management" | "unsupported";
export type RouterResult = { intent: RouterIntent; confidence: "high" | "low" };

const FALLBACK: RouterResult = { intent: "time_registration", confidence: "low" };

const routerOutputSchema = z.object({
  intent: z.enum(["time_registration", "work_item_management", "unsupported"]),
  confidence: z.enum(["high", "low"]).default("high"),
});

export async function classifyIntent(
  message: string,
  history: ConversationTurn[],
  provider: AgentProvider,
  model: string,
): Promise<RouterResult> {
  try {
    const contextLines = history
      .slice(-3)
      .map((t) => `${t.role === "user" ? "Usuario" : "Asistente"}: ${t.content}`)
      .join("\n");

    const userMessage = contextLines
      ? `Historial reciente:\n${contextLines}\n\nMensaje actual: ${message}`
      : message;

    const response = await provider.chat({
      model,
      temperature: 0,
      maxTokens: 80,
      systemPrompt: ROUTER_SYSTEM_PROMPT,
      userMessage,
    });

    const parsed = routerOutputSchema.safeParse(response.parsed);
    if (!parsed.success) return FALLBACK;

    return { intent: parsed.data.intent, confidence: parsed.data.confidence };
  } catch {
    return FALLBACK;
  }
}
