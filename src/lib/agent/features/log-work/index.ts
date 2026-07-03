import type { AgentFeatureKind } from "@/lib/agent/types";
import "@/lib/agent/tools/shared-tools";
import "./tool";

export const LOG_WORK_KIND: AgentFeatureKind = "log-work";

export { LOG_WORK_BATCH_TOOL_NAME, logWorkBatchTool } from "./tool";
export { runLogWorkFeature } from "./runner";