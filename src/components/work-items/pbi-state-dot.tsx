"use client";

import { usePbiStateColors } from "@/hooks/use-pbi-state-colors";
import { cn } from "@/lib/utils";

export type PbiStateDotProps = {
  state: string;
  className?: string;
};

/** Indicador circular del color del estado (filtros, leyendas, listas). */
export function PbiStateDot({ state, className }: PbiStateDotProps) {
  const { dotStyle } = usePbiStateColors(state);

  return (
    <span
      title={state}
      className={cn("inline-block size-2 shrink-0 rounded-full", className)}
      style={dotStyle}
      aria-hidden
    />
  );
}
