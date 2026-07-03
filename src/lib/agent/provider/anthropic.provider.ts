import "server-only";

import type {
  AgentProvider,
  ChatRequest,
  ChatResponse,
} from "@/lib/agent/provider/provider.types";

/**
 * Stub de Anthropic. Mantiene la firma Strategy para que la factory pueda enrutar
 * aquí cuando se implemente; mientras tanto, todos los intentos fallan con un
 * mensaje claro.
 */
export const ANTHROPIC_DEFAULT_MODEL = "claude-3-5-sonnet-latest";

export const anthropicProvider: AgentProvider = {
  name: "anthropic",
  defaultModel: process.env.ANTHROPIC_MODEL?.trim() || ANTHROPIC_DEFAULT_MODEL,
  async chat(_req: ChatRequest): Promise<ChatResponse> {
    throw new Error(
      "Proveedor Anthropic aún no implementado. Configura AGENT_PROVIDER=openai o implementa anthropicProvider.chat().",
    );
  },
};