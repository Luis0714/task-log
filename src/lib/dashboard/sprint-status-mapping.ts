export type SprintStatusMapping = {
  pending: readonly string[];
  /** En progreso (p. ej. Committed en historias). */
  inProgress: readonly string[];
  completed: readonly string[];
};

/** Estados que cuentan como desarrollada / atendida (incluye Stage y alias comunes en ADO). */
const DEVELOPED_STAGE_STATES = ["Stage", "In Stage", "Staging"] as const;

/** Historias de usuario — sustituible por configuración futura. */
export const USER_STORY_STATUS_MAPPING: SprintStatusMapping = {
  pending: ["New", "Approved"],
  inProgress: ["Committed"],
  completed: ["QA", "Review PO", ...DEVELOPED_STAGE_STATES, "Done"],
};

/** Bugs — sustituible por configuración futura. */
export const BUG_STATUS_MAPPING: SprintStatusMapping = {
  pending: ["New", "Approved", "Impediment", "Reopened"],
  inProgress: ["Committed"],
  completed: ["QA", ...DEVELOPED_STAGE_STATES, "Done"],
};

function normalizeStateName(state: string): string {
  return state.trim().toLowerCase();
}

export function isStageState(state: string): boolean {
  const normalized = normalizeStateName(state);
  return (
    normalized === "stage" ||
    normalized === "in stage" ||
    normalized === "staging" ||
    normalized.endsWith(" stage")
  );
}

export function stateMatchesCategory(
  state: string,
  categoryStates: readonly string[],
): boolean {
  const normalized = normalizeStateName(state);
  return categoryStates.some((candidate) => normalizeStateName(candidate) === normalized);
}

/** Desarrollada / atendida: estados del mapeo más Stage y alias. */
export function stateMatchesCompletedState(
  state: string,
  mapping: SprintStatusMapping,
): boolean {
  return stateMatchesCategory(state, mapping.completed) || isStageState(state);
}

export function countWorkItemsInCategory<T extends { state: string }>(
  items: readonly T[],
  categoryStates: readonly string[],
): number {
  return items.filter((item) => stateMatchesCategory(item.state, categoryStates)).length;
}
