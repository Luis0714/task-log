import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";

export function filterWorkItemsByClientCriteria(
  items: AdoWorkItemOptionDto[],
  filters: Pick<WorkItemFilters, "search" | "state">,
): AdoWorkItemOptionDto[] {
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

export function collectWorkItemStates(items: AdoWorkItemOptionDto[]): string[] {
  return [...new Set(items.map((item) => item.state).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}

export type WorkItemsByStateGroup = {
  state: string;
  items: AdoWorkItemOptionDto[];
};

/** Agrupa historias por estado, respetando el orden del proceso (backlog-states). */
export function groupWorkItemsByStates(
  items: AdoWorkItemOptionDto[],
  stateOrder: readonly string[],
): WorkItemsByStateGroup[] {
  const buckets = new Map<string, AdoWorkItemOptionDto[]>();

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
