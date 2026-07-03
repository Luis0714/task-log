import type { AdoWorkItemTypeState } from "@/lib/azure-devops/work-item-type-states";

export type PbiTransitionKind = "committed" | "qa" | "other";

/**
 * Determina el tipo de transición de una HU basado en el catálogo de Azure.
 *
 * - "committed" → estado categoría `InProgress` que NO es QA-like
 *   (p. ej. Committed, Impediment, In Progress)
 * - "qa" → estado categoría `InProgress` QA-like (nombre contiene QA/test/review/validat)
 * - "other" → cualquier otro estado
 */
export function getPbiTransitionKind(
  targetState: string,
  states: readonly AdoWorkItemTypeState[],
): PbiTransitionKind {
  const trimmed = targetState.trim();
  const state = states.find((s) => s.name === trimmed);
  if (!state || state.category !== "InProgress") return "other";
  return isQaLikeStateName(state.name) ? "qa" : "committed";
}

/**
 * Heurística local para identificar estados QA en procesos Scrum-like.
 * Esta es la única lista de palabras clave que queda — es semántica de
 * workflow (no visual), y NO se usa para colorear ni categorizar.
 */
function isQaLikeStateName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return (
    normalized.includes("qa") ||
    normalized.includes("test") ||
    normalized.includes("review") ||
    normalized.includes("validat")
  );
}

export function requiresCommittedDates(
  targetState: string,
  states: readonly AdoWorkItemTypeState[],
): boolean {
  return getPbiTransitionKind(targetState, states) === "committed";
}

export function requiresQaResponsables(
  targetState: string,
  states: readonly AdoWorkItemTypeState[],
): boolean {
  return getPbiTransitionKind(targetState, states) === "qa";
}