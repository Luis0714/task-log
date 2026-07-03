import { attachBugCounts, buildBugCountsByParentId } from "@/lib/dashboard/bug-counts";
import { buildSprintStatusMapping } from "@/lib/dashboard/sprint-status-mapping";
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

export type WorkItemsSectionLists = {
  filteredItems: DashboardWorkItem[];
  inProgress: DashboardWorkItem[];
  upcoming: DashboardWorkItem[];
  developed: DashboardWorkItem[];
};

/**
 * Construye las secciones del panel de HUs.
 *
 * `userStoryMapping` y `bugMapping` deben venir del snapshot cargado por
 * `loadWorkItemsBase`. Si no están disponibles (snapshot antiguo), se derivan
 * de `backlogStates`/`bugStates` como fallback.
 */
export function buildWorkItemsSectionLists(
  base: WorkItemsBaseSnapshot,
  filters: WorkItemFilters,
  mappings?: {
    userStoryMapping?: ReturnType<typeof buildSprintStatusMapping>;
    bugMapping?: ReturnType<typeof buildSprintStatusMapping>;
  },
): WorkItemsSectionLists {
  const userStoryMapping =
    mappings?.userStoryMapping ??
    buildSprintStatusMapping(base.backlogStates ?? []);
  const bugMapping =
    mappings?.bugMapping ??
    buildSprintStatusMapping(base.bugStates ?? []);

  const bugCountsByParentId = buildBugCountsByParentId(base.sprintBugs, bugMapping);
  const filtered = filterWorkItemsByClientCriteria(base.sprintWorkItems, {
    search: filters.search,
    states: filters.states,
  });

  const withBugCounts = (items: typeof filtered) =>
    attachBugCounts(mapToDashboardWorkItems(items), bugCountsByParentId);

  return {
    filteredItems: withBugCounts(filtered),
    inProgress: withBugCounts(selectInProgressWorkItems(filtered, userStoryMapping)),
    upcoming: withBugCounts(selectUpcomingWorkItems(filtered, userStoryMapping)),
    developed: withBugCounts(selectDevelopedWorkItems(filtered, userStoryMapping)),
  };
}