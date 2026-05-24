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

export const TASK_STATE_OPTIONS = ["To Do", "Done"] as const;

export type TaskState = (typeof TASK_STATE_OPTIONS)[number];

export const DEFAULT_TASK_ACTIVITY: TaskActivity = "Development";
export const DEFAULT_TASK_STATE: TaskState = "Done";

export function getDefaultWorkingDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Tipo de work item para PBIs/HUs (configurable vía env en servidor). */
export const DEFAULT_BACKLOG_ITEM_TYPE = "Product Backlog Item";
