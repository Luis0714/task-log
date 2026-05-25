"use client";

import { useMemo } from "react";

import {
  getPbiStateColorPresentation,
  type PbiStateColorPresentation,
} from "@/lib/work-items/pbi-state-colors";

/** Hook reutilizable: colores de estado (HU, Task, Bug) según tema activo. */
export function usePbiStateColors(state: string): PbiStateColorPresentation {
  return useMemo(() => getPbiStateColorPresentation(state), [state]);
}

/** Alias explícito para tasks, bugs y historias. */
export const useWorkItemStateColors = usePbiStateColors;
