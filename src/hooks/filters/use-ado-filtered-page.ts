"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAdoContextUrl } from "@/hooks/use-ado-context-url";
import { useWorkItemFiltersPanel } from "@/hooks/filters/use-work-item-filters-panel";
import { useWorkItemsFiltersContext } from "@/components/work-items/work-items-filters-context";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { buildAdoContextQuery } from "@/lib/ado/parse-context-search-params";
import { resolveCurrentSprint } from "@/lib/dashboard/resolve-current-sprint";
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
  const router = useRouter();
  const pathname = usePathname();
  const { filters, setSearch, setAssignee, setState, resetFilters } =
    useWorkItemsFiltersContext();

  const context = useAdoContextUrl({
    catalog,
    adoExecutionReady,
    assignee: filters.assignee,
    workItemsCount,
  });

  const currentSprint = useMemo(() => resolveCurrentSprint(catalog), [catalog]);

  const workItemStates = useMemo(
    () => filterMeta.states.map((state) => state.name),
    [filterMeta.states],
  );

  const filtersPanel = useWorkItemFiltersPanel({
    filters,
    setSearch,
    setAssignee: (value) => {
      setAssignee(value);
      router.push(
        `${pathname}${buildAdoContextQuery({
          project: catalog.project,
          team: catalog.team,
          sprint: catalog.sprintPath,
          assignee: value,
        })}`,
      );
    },
    setState,
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

  const catalogError =
    catalog.errors.projects ??
    catalog.errors.teams ??
    catalog.errors.sprints ??
    null;

  return { context, currentSprint, filtersPanel, catalogError };
}
