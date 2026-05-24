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
