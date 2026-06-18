import type { AgentFeatureKind } from "@/lib/agent/types";
import "@/lib/agent/tools/shared-tools";
import "./tool";

export const CREATE_TASKS_KIND: AgentFeatureKind = "create-tasks";

export { CREATE_TASKS_BATCH_TOOL_NAME, createTasksBatchTool } from "./tool";
export { runCreateTasksFeature } from "./runner";
export type { SprintContext } from "./runner";