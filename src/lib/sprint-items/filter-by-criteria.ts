import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";
import { filterWorkItemsByClientCriteria } from "@/lib/azure-devops/work-items-filters";

export const SPRINT_DAY_ALL = "__all__";

export type SprintItemListFilters = Pick<WorkItemFilters, "search" | "states"> & {
  dayKey: string;
};

export function filterSprintItemsByCriteria(
  items: AdoWorkItemOptionDto[],
  filters: SprintItemListFilters,
): AdoWorkItemOptionDto[] {
  const byText = filterWorkItemsByClientCriteria(items, {
    search: filters.search,
    states: filters.states,
  });

  if (!filters.dayKey || filters.dayKey === SPRINT_DAY_ALL) {
    return byText;
  }

  return byText.filter((item) => item.workingDate === filters.dayKey);
}

/** Ítems sin fecha de trabajo al final; mismo día ordenados por título. */
export function sortItemsByWorkingDateAsc(
  items: readonly AdoWorkItemOptionDto[],
): AdoWorkItemOptionDto[] {
  return [...items].sort((a, b) => {
    const aDate = a.workingDate?.trim() ?? "";
    const bDate = b.workingDate?.trim() ?? "";

    if (!aDate && !bDate) {
      return a.title.localeCompare(b.title, "es");
    }
    if (!aDate) return 1;
    if (!bDate) return -1;

    const byDate = aDate.localeCompare(bDate);
    if (byDate !== 0) return byDate;

    return a.title.localeCompare(b.title, "es");
  });
}
