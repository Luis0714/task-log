import { resolveDefaultWorkingDate } from "@/lib/time-log/working-date-default";

/** Valores de Activity en Tasks (proceso Scrum Azure DevOps). */
export const TASK_ACTIVITY_OPTIONS = [
  "Deployment",
  "Design",
  "Development",
  "Documentation",
  "Management",
  "Requirements",
  "Testing",
  "Training",
] as const;

export type TaskActivity = (typeof TASK_ACTIVITY_OPTIONS)[number];

/** Fallback legacy — no usar en UI; los estados deben cargarse desde Azure DevOps. */
export const FALLBACK_TASK_STATE_OPTIONS = ["To Do", "Closed"] as const;

export const DEFAULT_TASK_ACTIVITY: TaskActivity = "Development";

/** @deprecated Usa resolveDefaultWorkingDate con fechas del sprint cuando estén disponibles. */
export function getDefaultWorkingDate(): string {
  return resolveDefaultWorkingDate();
}

/** Tipo de work item para PBIs/HUs (configurable vía env en servidor). */
export const DEFAULT_BACKLOG_ITEM_TYPE = "Product Backlog Item";
