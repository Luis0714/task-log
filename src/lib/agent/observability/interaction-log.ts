import "server-only";

import { isUserPersistenceReady } from "@/lib/db/is-persistence-ready";
import { getRepositories } from "@/lib/db/container";
import type { AgentFeatureKind } from "@/lib/agent/types";

export type LogInteractionInput = {
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

export function logInteraction(input: LogInteractionInput): void {
  if (!isUserPersistenceReady()) return;

  const repos = getRepositories();
  if (!repos.llmInteraction) return;

  void repos.llmInteraction
    .record({
      userId: input.userId,
      feature: input.feature,
      model: input.model,
      latencyMs: input.latencyMs,
      requestHash: input.requestHash,
      responseJson: input.responseJson,
      ok: input.ok,
      promptTokens: input.promptTokens,
      completionTokens: input.completionTokens,
      errorMessage: input.errorMessage,
    })
    .catch(() => {
      // Fire-and-forget: el log nunca rompe el request.
    });
}