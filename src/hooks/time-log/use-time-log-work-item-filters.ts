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
    setState,
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
      state: committedState,
    };
  }, [committedState]);

  const resetFilters = useCallback(() => {
    userClearedStateFilterRef.current = false;
    replaceFilters(buildDefaultFilters());
  }, [buildDefaultFilters, replaceFilters]);

  const onStateChange = useCallback(
    (value: string) => {
      userClearedStateFilterRef.current = value === "";
      setState(value);
    },
    [setState],
  );

  useEffect(() => {
    if (userClearedStateFilterRef.current) return;
    if (!committedState || filters.state === committedState) return;
    if (filters.state !== "") return;
    setState(committedState);
  }, [committedState, filters.state, setState]);

  return {
    filters,
    setSearch,
    setAssignee,
    /** Actualización directa (p. ej. sincronización del panel al cambiar estados disponibles). */
    setState,
    /** Cambio iniciado por el usuario en el selector de estado. */
    onStateChange,
    resetFilters,
  };
}
