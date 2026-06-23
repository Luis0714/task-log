import { USER_MESSAGES } from "@/lib/errors/user-messages";

export type AgentErrorCode =
  | "rate_limited"
  | "provider_error"
  | "schema_invalid"
  | "unconfigured"
  | "no_tool_call"
  | "invalid_args"
  | "unknown_tool";

export function buildAgentErrorMessage(code: AgentErrorCode): string {
  switch (code) {
    case "rate_limited":
      return USER_MESSAGES.tooManyRequests;
    case "unconfigured":
      return USER_MESSAGES.copilotNotConfigured;
    case "no_tool_call":
      return USER_MESSAGES.copilotNoToolCall;
    case "invalid_args":
      return USER_MESSAGES.copilotInvalidArgs;
    case "schema_invalid":
      return USER_MESSAGES.copilotSchemaInvalid;
    case "unknown_tool":
      return USER_MESSAGES.copilotUnknownTool;
    case "provider_error":
      return USER_MESSAGES.copilotInterpret;
  }
}

export function describeProviderError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Error desconocido del proveedor.";
}

const NO_TOOL_CALL_PATTERN = /no invocó ninguna herramienta|sin contenido/i;
const INVALID_ARGS_PATTERN = /argumentos inválidos/i;
const UNKNOWN_TOOL_PATTERN = /herramienta (desconocida|intermedia desconocida)/i;
const SCHEMA_INVALID_PATTERN = /no cumple el esquema|formato inesperado|devolvió una respuesta inválida/i;

export function classifyAgentError(err: unknown): AgentErrorCode {
  const msg = describeProviderError(err);
  if (msg.toLowerCase().includes("api key")) return "unconfigured";
  if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("429")) return "rate_limited";
  if (NO_TOOL_CALL_PATTERN.test(msg)) return "no_tool_call";
  if (INVALID_ARGS_PATTERN.test(msg)) return "invalid_args";
  if (UNKNOWN_TOOL_PATTERN.test(msg)) return "unknown_tool";
  if (SCHEMA_INVALID_PATTERN.test(msg)) return "schema_invalid";
  return "provider_error";
}