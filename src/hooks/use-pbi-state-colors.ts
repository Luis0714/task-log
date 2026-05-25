"use client";

import { useMemo } from "react";

import {
  getPbiStateColorPresentation,
  type PbiStateColorPresentation,
} from "@/lib/work-items/pbi-state-colors";

/** Hook reutilizable: colores de estado HU según tema activo (vía CSS variables). */
export function usePbiStateColors(state: string): PbiStateColorPresentation {
  return useMemo(() => getPbiStateColorPresentation(state), [state]);
}
