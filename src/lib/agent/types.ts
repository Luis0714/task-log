import type { PreviewResult } from "@/lib/schemas/agent";

export type AgentFeatureKind = "log-work" | "create-tasks" | "weekly-summary" | "chat";

export type AgentRunResult<T = PreviewResult> =
  | { ok: true; kind: AgentFeatureKind; data: T }
  | {
      ok: false;
      kind: AgentFeatureKind;
      code:
        | "rate_limited"
        | "provider_error"
        | "schema_invalid"
        | "unconfigured"
        | "no_tool_call"
        | "invalid_args"
        | "unknown_tool";
      userMessage: string;
      cause?: unknown;
    };

export type AgentRunContext = {
  userId: string;
  featureKind: AgentFeatureKind;
  requestHash: string;
  startedAt: number;
};