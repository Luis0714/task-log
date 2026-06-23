import { resolveDefaultWorkingDate } from "@/lib/time-log/working-date-default";

export { DEFAULT_WORKING_TIME, getDefaultWorkingTime } from "@/lib/date/ado-datetime";

export const TASK_ACTIVITY_OPTIONS = [
  "Development",
  "QA",
  "Code review",
  "Design",
  "Documentation",
  "Meeting",
] as const;

export type TaskActivity = string;

export const TASK_ACTIVITY_LABELS: Record<string, string> = {
  Development: "Desarrollo",
  QA: "QA",
  "Code review": "Revisión de código",
  Design: "Diseño",
  Documentation: "Documentación",
  Meeting: "Reunión",
};

/** Fallback legacy — no usar en UI; los estados deben cargarse desde Azure DevOps. */
export const FALLBACK_TASK_STATE_OPTIONS = ["To Do", "Closed"] as const;

export const DEFAULT_TASK_ACTIVITY: TaskActivity = "Development";

/** @deprecated Usa resolveDefaultWorkingDate con fechas del sprint cuando estén disponibles. */
export function getDefaultWorkingDate(): string {
  return resolveDefaultWorkingDate();
}

/** Tipo de work item para PBIs/HUs (configurable vía env en servidor). */
export const DEFAULT_BACKLOG_ITEM_TYPE = "Product Backlog Item";
