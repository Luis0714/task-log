import "server-only";

import {
  runFeature,
  type RunCreateTasksInput,
} from "@/lib/agent/orchestrator/run-feature";
import type { ToolExecutionContext } from "@/lib/agent/tools/types";
import type { PreviewResult } from "@/lib/schemas/agent";

export type InterpretUserMessageResult =
  | { ok: true; preview: PreviewResult }
  | { ok: false; userMessage: string };

export async function interpretUserMessage(
  message: string,
  options: {
    userId: string;
    createTasksInput?: RunCreateTasksInput;
    executionContext?: ToolExecutionContext;
  },
): Promise<InterpretUserMessageResult> {
  const input = options.createTasksInput ?? { kind: "log-work", message };
  const result = await runFeature(input, {
    userId: options.userId,
    executionContext: options.executionContext,
  });
  if (result.ok) return { ok: true, preview: result.data };
  return { ok: false, userMessage: result.userMessage };
}

export { runFeature } from "@/lib/agent/orchestrator/run-feature";
export type { AgentFeatureKind, AgentRunResult } from "@/lib/agent/types";
export { LOG_WORK_KIND } from "@/lib/agent/features/log-work";
export { CREATE_TASKS_KIND } from "@/lib/agent/features/create-tasks";
export type { SprintContext } from "@/lib/agent/features/create-tasks";