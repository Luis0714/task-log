import { attachBugCounts, buildBugCountsByParentId } from "@/lib/dashboard/bug-counts";
import type { WorkItemsBaseSnapshot } from "@/lib/work-items/load-work-items-base";
import {
  filterWorkItemsByClientCriteria,
  selectDevelopedWorkItems,
  selectInProgressWorkItems,
  selectUpcomingWorkItems,
} from "@/lib/azure-devops/work-items-filters";
import type { DashboardWorkItem } from "@/lib/dashboard/types";
import { mapToDashboardWorkItems } from "@/lib/dashboard/work-item-selectors";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";

export function buildWorkItemsSectionLists(
  base: WorkItemsBaseSnapshot,
  filters: WorkItemFilters,
): {
  filteredItems: DashboardWorkItem[];
  inProgress: DashboardWorkItem[];
  upcoming: DashboardWorkItem[];
  developed: DashboardWorkItem[];
} {
  const bugCountsByParentId = buildBugCountsByParentId(base.sprintBugs);
  const filtered = filterWorkItemsByClientCriteria(base.sprintWorkItems, {
    search: filters.search,
    states: filters.states,
  });

  const withBugCounts = (items: typeof filtered) =>
    attachBugCounts(mapToDashboardWorkItems(items), bugCountsByParentId);

  return {
    filteredItems: withBugCounts(filtered),
    inProgress: withBugCounts(selectInProgressWorkItems(filtered)),
    upcoming: withBugCounts(selectUpcomingWorkItems(filtered)),
    developed: withBugCounts(selectDevelopedWorkItems(filtered)),
  };
}
