"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import { useWorkItemFilters } from "@/hooks/use-work-item-filters";
import { resolveCommittedBacklogStateName } from "@/lib/azure-devops/work-items-filters";
import {
  DEFAULT_WORK_ITEM_FILTERS,
  type WorkItemFilters,
} from "@/lib/schemas/work-item-filters";

export function useTimeLogWorkItemFilters(workItemStates: readonly string[]) {
  const {
    filters,
    setSearch,
    setAssignee,
    setStates,
    replaceFilters,
  } = useWorkItemFilters();

  const userClearedStateFilterRef = useRef(false);

  const committedState = useMemo(
    () => resolveCommittedBacklogStateName(workItemStates),
    [workItemStates],
  );

  const buildDefaultFilters = useCallback((): WorkItemFilters => {
    return {
      ...DEFAULT_WORK_ITEM_FILTERS,
      states: committedState ? [committedState] : [],
    };
  }, [committedState]);

  const resetFilters = useCallback(() => {
    userClearedStateFilterRef.current = false;
    replaceFilters(buildDefaultFilters());
  }, [buildDefaultFilters, replaceFilters]);

  const onStatesChange = useCallback(
    (value: string[]) => {
      userClearedStateFilterRef.current = value.length === 0;
      setStates(value);
    },
    [setStates],
  );

  useEffect(() => {
    if (userClearedStateFilterRef.current) return;
    if (!committedState) return;
    if (filters.states.length > 0) return;
    setStates([committedState]);
  }, [committedState, filters.states.length, setStates]);

  return {
    filters,
    setSearch,
    setAssignee,
    setStates,
    onStatesChange,
    resetFilters,
  };
}
