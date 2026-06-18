import type { z } from "zod";

export type ProviderName = "openai" | "anthropic" | "mock";

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type ToolChoice = "auto" | "required" | { name: string };

export type ToolCall = {
  id: string;
  name: string;
  arguments: unknown;
};

export type ChatRequest = {
  model: string;
  temperature: number;
  systemPrompt: string;
  userMessage: string;
  responseJsonSchema?: z.ZodTypeAny;
  maxTokens?: number;
  requestTimeoutMs?: number;
  tools?: readonly ToolDefinition[];
  toolChoice?: ToolChoice;
};

export type ChatResponse = {
  raw: string;
  parsed: unknown;
  model: string;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  toolCalls?: readonly ToolCall[];
};

/**
 * Cada proveedor declara su modelo por defecto. El orquestador usa
 * `provider.defaultModel` como fallback si la ruta / feature no especifica uno.
 *
 * El override por env var sigue siendo responsabilidad de cada proveedor
 * (OpenAI mira OPENAI_MODEL, Anthropic miraría ANTHROPIC_MODEL, etc.).
 */
export interface AgentProvider {
  readonly name: ProviderName;
  readonly defaultModel: string;
  chat(req: ChatRequest): Promise<ChatResponse>;
}