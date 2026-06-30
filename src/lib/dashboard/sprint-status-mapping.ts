/**
 * Mapeo dinámico de estados de work item (HU, Bug) a categorías de sprint
 * (pending / inProgress / completed) basado en la categoría canónica de Azure.
 *
 * Single source of truth: el `category` que viene de
 * `GET /wit/workitemtypes/{type}/states?api-version=7.1`.
 *   - "Proposed"   → pending
 *   - "InProgress" → inProgress
 *   - "Resolved"   → completed (para métricas de sprint)
 *   - "Completed"  → completed
 *   - "Removed"    → ignorado
 */

import type { AdoWorkItemTypeState } from "@/lib/azure-devops/work-item-type-states";

export type SprintStatusMapping = {
  pending: readonly string[];
  /** En progreso (p. ej. Committed en historias). */
  inProgress: readonly string[];
  completed: readonly string[];
};

/**
 * Construye el mapeo de sprint a partir del catálogo de Azure DevOps.
 *
 * Usar siempre que se necesite categorizar work items por estado de sprint.
 * Llamar UNA vez por loader y pasar el resultado a las funciones helper.
 */
export function buildSprintStatusMapping(
  states: readonly AdoWorkItemTypeState[] | null | undefined,
): SprintStatusMapping {
  const pending: string[] = [];
  const inProgress: string[] = [];
  const completed: string[] = [];

  for (const state of states ?? []) {
    switch (state.category) {
      case "Proposed":
        pending.push(state.name);
        break;
      case "InProgress":
        inProgress.push(state.name);
        break;
      case "Resolved":
      case "Completed":
        completed.push(state.name);
        break;
      default:
        // "Removed" y categorías desconocidas: ignoradas.
        break;
    }
  }

  return { pending, inProgress, completed };
}

function normalizeStateName(state: string): string {
  return state.trim().toLowerCase();
}

export function stateMatchesCategory(
  state: string,
  categoryStates: readonly string[],
): boolean {
  const normalized = normalizeStateName(state);
  return categoryStates.some(
    (candidate) => normalizeStateName(candidate) === normalized,
  );
}

/**
 * Verdadero si el estado cuenta como desarrollado/atendido para sprint:
 * cualquier estado de `completed` según el mapeo.
 */
export function stateMatchesCompletedState(
  state: string,
  mapping: SprintStatusMapping,
): boolean {
  return stateMatchesCategory(state, mapping.completed);
}

export function countWorkItemsInCategory<T extends { state: string }>(
  items: readonly T[],
  categoryStates: readonly string[],
): number {
  return items.filter((item) => stateMatchesCategory(item.state, categoryStates))
    .length;
}