import type { z } from "zod";

export type ProviderName = "openai" | "anthropic" | "mock";

export type ToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  strict?: boolean;
};

export type ToolChoice = "auto" | "required" | { name: string };

export type ToolCall = {
  id: string;
  name: string;
  arguments: unknown;
};

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: unknown;
  tool_call_id?: string;
};

/** A previous user/assistant exchange passed to the LLM for context. */
export type ConversationTurn = {
  role: "user" | "assistant";
  content: string;
};

export type ChatRequest = {
  model: string;
  temperature: number;
  systemPrompt: string;
  userMessage?: string;
  messages?: ChatMessage[];
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
  rawToolCalls?: unknown;
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