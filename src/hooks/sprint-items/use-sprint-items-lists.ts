"use client";

import { useMemo } from "react";

import type { SprintItemsDataSnapshot } from "@/lib/sprint-items/load-sprint-items-data";
import { filterSprintItemsByCriteria } from "@/lib/sprint-items/filter-by-criteria";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";

export function useSprintItemsLists(
  snapshot: SprintItemsDataSnapshot,
  filters: WorkItemFilters,
  dayKey: string,
) {
  const filteredItems = useMemo(
    () =>
      filterSprintItemsByCriteria(snapshot.items, {
        search: filters.search,
        states: filters.states,
        dayKey,
      }),
    [dayKey, filters.search, filters.states, snapshot.items],
  );

  const stateNames = useMemo(
    () => snapshot.itemStates.map((state) => state.name),
    [snapshot.itemStates],
  );

  return { filteredItems, stateNames };
}
