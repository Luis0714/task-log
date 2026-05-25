import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";
import { filterWorkItemsByClientCriteria } from "@/lib/azure-devops/work-items-filters";

export const SPRINT_DAY_ALL = "__all__";

export type SprintItemListFilters = Pick<WorkItemFilters, "search" | "state"> & {
  dayKey: string;
};

export function filterSprintItemsByCriteria(
  items: AdoWorkItemOptionDto[],
  filters: SprintItemListFilters,
): AdoWorkItemOptionDto[] {
  const byText = filterWorkItemsByClientCriteria(items, {
    search: filters.search,
    state: filters.state,
  });

  if (!filters.dayKey || filters.dayKey === SPRINT_DAY_ALL) {
    return byText;
  }

  return byText.filter((item) => item.workingDate === filters.dayKey);
}
