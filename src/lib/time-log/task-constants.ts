import { resolveDefaultWorkingDate } from "@/lib/time-log/working-date-default";

export { DEFAULT_WORKING_TIME, getDefaultWorkingTime } from "@/lib/date/ado-datetime";

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

/** Etiquetas en español para el selector de actividad (los valores enviados a ADO siguen en inglés). */
export const TASK_ACTIVITY_LABELS: Record<TaskActivity, string> = {
  Deployment: "Despliegue",
  Design: "Diseño",
  Development: "Desarrollo",
  Documentation: "Documentación",
  Management: "Gestión",
  Requirements: "Requisitos",
  Testing: "Pruebas",
  Training: "Formación",
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
