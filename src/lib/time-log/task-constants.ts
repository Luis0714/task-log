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

/** Fallback si no se pueden cargar estados desde Azure DevOps. */
export const FALLBACK_TASK_STATE_OPTIONS = ["To Do", "Done", "Closed"] as const;

export const DEFAULT_TASK_ACTIVITY: TaskActivity = "Development";

export function getDefaultWorkingDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Tipo de work item para PBIs/HUs (configurable vía env en servidor). */
export const DEFAULT_BACKLOG_ITEM_TYPE = "Product Backlog Item";
