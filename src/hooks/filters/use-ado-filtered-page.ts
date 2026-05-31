"use client";

import { useMemo } from "react";

import { useAdoContextPage } from "@/hooks/filters/use-ado-context-page";
import { usePushWorkItemAssigneeUrl } from "@/hooks/filters/use-push-work-item-assignee-url";
import { useWorkItemFiltersPanel } from "@/hooks/filters/use-work-item-filters-panel";
import { useWorkItemsFiltersContext } from "@/components/work-items/work-items-filters-context";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type { AdoFilterMeta } from "@/lib/filters/ado-filter-meta";

export type UseAdoFilteredPageOptions = {
  catalog: AdoCatalogSnapshot;
  filterMeta: AdoFilterMeta;
  adoExecutionReady: boolean;
  workItemsCount?: number;
};

export function useAdoFilteredPage({
  catalog,
  filterMeta,
  adoExecutionReady,
  workItemsCount = 0,
}: UseAdoFilteredPageOptions) {
  const { pushAssignee } = usePushWorkItemAssigneeUrl();
  const { filters, setSearch, setAssignee, setStates, resetFilters } =
    useWorkItemsFiltersContext();

  const { context, currentSprint, catalogError } = useAdoContextPage({
    catalog,
    adoExecutionReady,
    assignee: filters.assignee,
    workItemsCount,
  });

  const workItemStates = useMemo(
    () => filterMeta.states.map((state) => state.name),
    [filterMeta.states],
  );

  const filtersPanel = useWorkItemFiltersPanel({
    filters,
    setSearch,
    setAssignee: (value) => {
      setAssignee(value);
      pushAssignee(value, {
        project: catalog.project,
        team: catalog.team,
        sprint: catalog.sprintPath,
      });
    },
    setStates,
    resetFilters,
    sprintPath: catalog.sprintPath,
    items: [],
    stateNames: workItemStates,
    members: filterMeta.members,
    membersLoading: false,
    membersError: null,
    totalCount: 0,
    filteredCount: 0,
  });

  return { context, currentSprint, filtersPanel, catalogError };
}
