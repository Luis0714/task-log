import "server-only";

import { getDb } from "@/lib/db/client";
import type {
  LlmInteractionRecord,
  LlmInteractionRepository,
} from "@/lib/db/ports/llm-interaction.repository.port";
import { llmInteractions } from "@/lib/db/schema";

export const drizzleLlmInteractionRepository: LlmInteractionRepository = {
  async record(row: LlmInteractionRecord): Promise<void> {
    await getDb().insert(llmInteractions).values({
      userId: row.userId,
      feature: row.feature,
      model: row.model,
      promptTokens: row.promptTokens ?? null,
      completionTokens: row.completionTokens ?? null,
      latencyMs: row.latencyMs,
      requestHash: row.requestHash,
      responseJson: row.responseJson,
      ok: row.ok,
      errorMessage: row.errorMessage ?? null,
    });
  },
};