"use client";

import { useCallback } from "react";

import { useWorkItemFilters } from "@/hooks/use-work-item-filters";
import {
  DEFAULT_WORK_ITEM_FILTERS,
  WORK_ITEM_ASSIGNEE_ALL,
  type WorkItemFilters,
} from "@/lib/schemas/work-item-filters";

/**
 * Filtros de work items en la página de registro de tiempos.
 *
 * Por defecto muestra TODOS los estados y TODOS los asignados (no se
 * pre-selecciona "Committed" ni "Asignados a mí"); el usuario puede acotar
 * la vista desde el panel de filtros.
 */
export function useTimeLogWorkItemFilters(
  initial?: Partial<WorkItemFilters>,
) {
  const {
    filters,
    setSearch,
    setAssignee,
    setStates,
    replaceFilters,
  } = useWorkItemFilters({
    ...initial,
    assignee: initial?.assignee ?? WORK_ITEM_ASSIGNEE_ALL,
  });

  const buildDefaultFilters = useCallback((): WorkItemFilters => {
    return {
      ...DEFAULT_WORK_ITEM_FILTERS,
      assignee: WORK_ITEM_ASSIGNEE_ALL,
      states: [],
    };
  }, []);

  const resetFilters = useCallback(() => {
    replaceFilters(buildDefaultFilters());
  }, [buildDefaultFilters, replaceFilters]);

  return {
    filters,
    setSearch,
    setAssignee,
    setStates,
    resetFilters,
  };
}