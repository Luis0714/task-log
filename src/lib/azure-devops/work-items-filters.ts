import {
  stateMatchesCategory,
  stateMatchesCompletedState,
  USER_STORY_STATUS_MAPPING,
} from "@/lib/dashboard/sprint-status-mapping";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";
import { filterUserStoriesByWorkflowCategory } from "@/lib/work-items/user-story-workflow-status";

export type AdoWorkItemOption = AdoWorkItemOptionDto;

export type WorkItemsByStateGroup = {
  state: string;
  items: AdoWorkItemOption[];
};

function normalizeState(state: string): string {
  return state.trim().toLowerCase();
}

function compareByPriority(a: AdoWorkItemOption, b: AdoWorkItemOption): number {
  const priorityA = typeof a.priority === "number" ? a.priority : 99;
  const priorityB = typeof b.priority === "number" ? b.priority : 99;
  if (priorityA !== priorityB) return priorityA - priorityB;
  return a.title.localeCompare(b.title, "es");
}

export function filterWorkItemsByClientCriteria(
  items: AdoWorkItemOption[],
  filters: Pick<WorkItemFilters, "search" | "state">,
): AdoWorkItemOption[] {
  const search = filters.search.trim().toLowerCase();

  return items.filter((item) => {
    if (filters.state && item.state !== filters.state) return false;

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

export function isCommittedPbiState(state: string): boolean {
  return stateMatchesCategory(state, USER_STORY_STATUS_MAPPING.inProgress);
}

/** Nombre exacto del estado Committed en el catálogo ADO (p. ej. registro de tiempo). */
export function resolveCommittedBacklogStateName(states: readonly string[]): string {
  return states.find((state) => isCommittedPbiState(state)) ?? "";
}

/** Pendientes del sprint que aún no están en curso (próximo trabajo). */
const UPCOMING_PENDING_NORMALIZED = USER_STORY_STATUS_MAPPING.pending.map(normalizeState);

const UPCOMING_STATE_ALIASES = ["proposed", "to do", "todo", "pending", "ready"] as const;

export function isUpcomingPbiState(state: string): boolean {
  if (isCommittedPbiState(state)) return false;

  const normalized = normalizeState(state);
  if (UPCOMING_PENDING_NORMALIZED.includes(normalized)) return true;

  return (UPCOMING_STATE_ALIASES as readonly string[]).includes(normalized);
}

export function selectInProgressWorkItems(items: AdoWorkItemOption[]): AdoWorkItemOption[] {
  return filterUserStoriesByWorkflowCategory(items, "inProgress").sort(compareByPriority);
}

export function selectUpcomingWorkItems(items: AdoWorkItemOption[]): AdoWorkItemOption[] {
  return filterUserStoriesByWorkflowCategory(items, "pending").sort(compareByPriority);
}

export function isDevelopedPbiState(state: string): boolean {
  return stateMatchesCompletedState(state, USER_STORY_STATUS_MAPPING);
}

export function selectDevelopedWorkItems(items: AdoWorkItemOption[]): AdoWorkItemOption[] {
  return filterUserStoriesByWorkflowCategory(items, "developed").sort(compareByPriority);
}
