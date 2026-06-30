"use client";

import { useMemo } from "react";

import { attachBugCounts, buildBugCountsByParentId } from "@/lib/dashboard/bug-counts";
import { buildSprintStatusMapping, type SprintStatusMapping } from "@/lib/dashboard/sprint-status-mapping";
import type { WorkItemsListsSnapshot } from "@/lib/ado/types";
import {
  filterWorkItemsByClientCriteria,
  selectDevelopedWorkItems,
  selectInProgressWorkItems,
  selectUpcomingWorkItems,
} from "@/lib/azure-devops/work-items-filters";
import type { WorkItemFilters } from "@/lib/schemas/work-item-filters";

/**
 * Fallback vacío cuando el snapshot todavía no cargó. Construye mappings vacíos
 * para que los selectores no fallen al evaluar work items sin contexto.
 */
const EMPTY_MAPPING: SprintStatusMapping = { pending: [], inProgress: [], completed: [] };

export function useWorkItemsLists(
  snapshot: WorkItemsListsSnapshot,
  filters: WorkItemFilters,
) {
  const userStoryMapping = useMemo(
    () => snapshot.userStoryMapping ?? buildSprintStatusMapping(snapshot.backlogStates),
    [snapshot.userStoryMapping, snapshot.backlogStates],
  );
  const bugMapping = useMemo(
    () => snapshot.bugMapping ?? buildSprintStatusMapping(snapshot.bugStates ?? []),
    [snapshot.bugMapping, snapshot.bugStates],
  );

  const bugCountsByParentId = useMemo(() => {
    const mapping = bugMapping ?? EMPTY_MAPPING;
    return buildBugCountsByParentId(snapshot.sprintBugs, mapping);
  }, [snapshot.sprintBugs, bugMapping]);

  const filteredItems = useMemo(() => {
    const items = filterWorkItemsByClientCriteria(snapshot.sprintWorkItems, {
      search: filters.search,
      states: filters.states,
    });
    return attachBugCounts(items, bugCountsByParentId);
  }, [bugCountsByParentId, filters.search, filters.states, snapshot.sprintWorkItems]);

  const inProgress = useMemo(
    () => selectInProgressWorkItems(filteredItems, userStoryMapping),
    [filteredItems, userStoryMapping],
  );

  const upcoming = useMemo(
    () => selectUpcomingWorkItems(filteredItems, userStoryMapping),
    [filteredItems, userStoryMapping],
  );

  const developed = useMemo(
    () => selectDevelopedWorkItems(filteredItems, userStoryMapping),
    [filteredItems, userStoryMapping],
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