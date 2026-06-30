import { stateMatchesCategory, type SprintStatusMapping } from "@/lib/dashboard/sprint-status-mapping";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import {
  workItemMatchesStates,
  type WorkItemFilters,
} from "@/lib/schemas/work-item-filters";
import { filterUserStoriesByWorkflowCategory } from "@/lib/work-items/user-story-workflow-status";

export type AdoWorkItemOption = AdoWorkItemOptionDto;

export type WorkItemsByStateGroup = {
  state: string;
  items: AdoWorkItemOption[];
};

function compareByPriority(a: AdoWorkItemOption, b: AdoWorkItemOption): number {
  const priorityA = typeof a.priority === "number" ? a.priority : 99;
  const priorityB = typeof b.priority === "number" ? b.priority : 99;
  if (priorityA !== priorityB) return priorityA - priorityB;
  return a.title.localeCompare(b.title, "es");
}

function normalizeState(state: string): string {
  return state.trim().toLowerCase();
}

export { normalizeState };

export function filterWorkItemsByClientCriteria(
  items: AdoWorkItemOption[],
  filters: Pick<WorkItemFilters, "search" | "states">,
): AdoWorkItemOption[] {
  const search = filters.search.trim().toLowerCase();

  return items.filter((item) => {
    if (!workItemMatchesStates(item.state, filters.states)) return false;

    if (search) {
      const haystack = `#${item.id} ${item.title}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

export function collectWorkItemStates(items: AdoWorkItemOption[]): string[] {
  return [...new Set(items.map((item) => item.state).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}

export function groupWorkItemsByStates(
  items: AdoWorkItemOption[],
  stateOrder: readonly string[],
): WorkItemsByStateGroup[] {
  const buckets = new Map<string, AdoWorkItemOption[]>();

  for (const state of stateOrder) {
    buckets.set(state, []);
  }

  for (const item of items) {
    const state = item.state?.trim();
    if (!state) continue;
    if (!buckets.has(state)) buckets.set(state, []);
    buckets.get(state)!.push(item);
  }

  const ordered = stateOrder.map((state) => ({
    state,
    items: buckets.get(state) ?? [],
  }));

  for (const [state, stateItems] of buckets) {
    if (!stateOrder.includes(state) && stateItems.length > 0) {
      ordered.push({ state, items: stateItems });
    }
  }

  return ordered;
}

export function isCommittedPbiState(
  state: string,
  mapping: SprintStatusMapping,
): boolean {
  return stateMatchesCategory(state, mapping.inProgress);
}

/** Nombre exacto del estado Committed en el catálogo ADO (p. ej. registro de tiempo). */
export function resolveCommittedBacklogStateName(
  states: readonly string[],
  mapping: SprintStatusMapping,
): string {
  return states.find((state) => isCommittedPbiState(state, mapping)) ?? "";
}

/**
 * Pendientes del sprint que aún no están en curso (próximo trabajo).
 * El mapeo se construye en el loader con `buildSprintStatusMapping(states)`.
 */
export function isUpcomingPbiState(
  state: string,
  mapping: SprintStatusMapping,
): boolean {
  if (isCommittedPbiState(state, mapping)) return false;
  return stateMatchesCategory(state, mapping.pending);
}

export function selectInProgressWorkItems(
  items: AdoWorkItemOption[],
  mapping: SprintStatusMapping,
): AdoWorkItemOption[] {
  return filterUserStoriesByWorkflowCategory(items, "inProgress", mapping).sort(
    compareByPriority,
  );
}

export function selectUpcomingWorkItems(
  items: AdoWorkItemOption[],
  mapping: SprintStatusMapping,
): AdoWorkItemOption[] {
  return filterUserStoriesByWorkflowCategory(items, "pending", mapping).sort(
    compareByPriority,
  );
}

export function selectDevelopedWorkItems(
  items: AdoWorkItemOption[],
  mapping: SprintStatusMapping,
): AdoWorkItemOption[] {
  return filterUserStoriesByWorkflowCategory(items, "developed", mapping).sort(
    compareByPriority,
  );
}