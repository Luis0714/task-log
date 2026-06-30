"use client";

import { useMemo } from "react";

import { useBacklogItemStates } from "@/hooks/work-items/use-backlog-item-states";
import {
  getStatePresentation,
  type WorkItemStatePresentation,
} from "@/lib/work-items/pbi-state-colors";

/**
 * Hook reutilizable: colores de estado (HU, Task, Bug) según el catálogo de Azure.
 *
 * Fuente única: `useBacklogItemStates` → colores y categorías que vienen
 * directo de Azure DevOps. NO hay heurísticas hardcodeadas.
 */
export function usePbiStateColors(state: string): WorkItemStatePresentation {
  const { states } = useBacklogItemStates();
  return useMemo(() => getStatePresentation(states, state), [states, state]);
}

/** Alias explícito para tasks, bugs y historias. */
export const useWorkItemStateColors = usePbiStateColors;