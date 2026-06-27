import "server-only";

import {
  runFeature,
  type ProgressCallback,
  type RunLogWorkInput,
} from "@/lib/agent/orchestrator/run-feature";
import type { ToolExecutionContext } from "@/lib/agent/tools/types";
import type { ConversationTurn } from "@/lib/agent/provider/provider.types";
import type { PreviewResult } from "@/lib/schemas/agent";
import type { SprintContext } from "@/lib/agent/features/create-tasks";

export type InterpretUserMessageResult =
  | { ok: true; preview: PreviewResult }
  | { ok: false; userMessage: string };

export async function interpretUserMessage(
  message: string,
  options: {
    userId: string;
    sprintContext?: SprintContext;
    executionContext?: ToolExecutionContext;
    history?: ConversationTurn[];
    userRole?: string;
    onProgress?: ProgressCallback;
  },
): Promise<InterpretUserMessageResult> {
  const input: RunLogWorkInput = {
    kind: "log-work",
    message,
    sprintContext: options.sprintContext,
    history: options.history,
    userRole: options.userRole,
  };
  const result = await runFeature(input, {
    userId: options.userId,
    executionContext: options.executionContext,
    ...(options.onProgress ? { onProgress: options.onProgress } : {}),
  });
  if (result.ok) return { ok: true, preview: result.data };
  return { ok: false, userMessage: result.userMessage };
}

export { runFeature } from "@/lib/agent/orchestrator/run-feature";
export type { AgentFeatureKind, AgentRunResult } from "@/lib/agent/types";
export { LOG_WORK_KIND } from "@/lib/agent/features/log-work";
export { CREATE_TASKS_KIND } from "@/lib/agent/features/create-tasks";
export type { SprintContext } from "@/lib/agent/features/create-tasks";
