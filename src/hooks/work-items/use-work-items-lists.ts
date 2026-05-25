"use client";

import { useMemo } from "react";

import { attachBugCounts, buildBugCountsByParentId } from "@/lib/dashboard/bug-counts";
import type { WorkItemsListsSnapshot } from "@/lib/ado/types";
import {
  filterWorkItemsByClientCriteria,
  selectDevelopedWorkItems,
  selectInProgressWorkItems,
  selectUpcomingWorkItems,
} from "@/lib/azure-devops/work-items-filters";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";

export function useWorkItemsLists(
  snapshot: WorkItemsListsSnapshot,
  filters: WorkItemFilters,
) {
  const bugCountsByParentId = useMemo(
    () => buildBugCountsByParentId(snapshot.sprintBugs),
    [snapshot.sprintBugs],
  );

  const filteredItems = useMemo(() => {
    const items = filterWorkItemsByClientCriteria(snapshot.sprintWorkItems, {
      search: filters.search,
      state: filters.state,
    });
    return attachBugCounts(items, bugCountsByParentId);
  }, [bugCountsByParentId, filters.search, filters.state, snapshot.sprintWorkItems]);

  const inProgress = useMemo(
    () => selectInProgressWorkItems(filteredItems),
    [filteredItems],
  );

  const upcoming = useMemo(
    () => selectUpcomingWorkItems(filteredItems),
    [filteredItems],
  );

  const developed = useMemo(
    () => selectDevelopedWorkItems(filteredItems),
    [filteredItems],
  );

  const workItemStates = useMemo(
    () => snapshot.backlogStates.map((state) => state.name),
    [snapshot.backlogStates],
  );

  return {
    filteredItems,
    inProgress,
    upcoming,
    developed,
    workItemStates,
  };
}
