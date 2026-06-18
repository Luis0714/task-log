import type { AgentFeatureKind } from "@/lib/agent/types";

export type LlmInteractionRecord = {
  userId: string;
  feature: AgentFeatureKind;
  model: string;
  latencyMs: number;
  requestHash: string;
  responseJson: unknown;
  ok: boolean;
  promptTokens?: number;
  completionTokens?: number;
  errorMessage?: string;
};

export interface LlmInteractionRepository {
  record(row: LlmInteractionRecord): Promise<void>;
}