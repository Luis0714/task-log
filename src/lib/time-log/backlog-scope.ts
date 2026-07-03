export const BACKLOG_SPRINT_VALUE = "__backlog__";
export const BACKLOG_SPRINT_LABEL = "Backlog completo";

export function isBacklogScope(sprintPath: string | null | undefined): boolean {
  return sprintPath?.trim() === BACKLOG_SPRINT_VALUE;
}

/**
 * IterationPath a usar al ejecutar acciones en ADO. En scope backlog devuelve
 * cadena vacía para que la tarea herede la iteración de su historia padre.
 */
export function resolveExecutionSprintPath(sprintPath: string): string {
  return isBacklogScope(sprintPath) ? "" : sprintPath;
}
