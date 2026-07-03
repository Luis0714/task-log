import "server-only";

import { anthropicProvider } from "@/lib/agent/provider/anthropic.provider";
import { openaiProvider } from "@/lib/agent/provider/openai.provider";
import type { AgentProvider, ProviderName } from "@/lib/agent/provider/provider.types";

/**
 * Simple Factory: devuelve el proveedor correcto.
 *
 * Orden de resolución:
 * 1. Variable de entorno `AGENT_PROVIDER` (openai | anthropic).
 * 2. Heurística por prefijo del modelo (claude-* → anthropic, resto → openai).
 * 3. Default: openai.
 */
export function createAgentProvider(): AgentProvider {
  const explicit = process.env.AGENT_PROVIDER?.trim().toLowerCase();
  if (explicit === "anthropic") return anthropicProvider;
  if (explicit === "openai") return openaiProvider;

  const model = process.env.OPENAI_MODEL?.trim().toLowerCase() ?? "";
  if (model.startsWith("claude")) return anthropicProvider;

  return openaiProvider;
}

export function resolveAgentProviderName(): ProviderName {
  return createAgentProvider().name;
}