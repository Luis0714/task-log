"use client";

import { PbiStateDot } from "@/components/work-items/pbi-state-dot";
import { formatWorkItemStateLabel } from "@/lib/work-items/pbi-state-colors";
import { cn } from "@/lib/utils";

export type WorkItemStateLabelProps = {
  state: string;
  className?: string;
};

/** Etiqueta con punto de color (selects, listas, leyendas). */
export function WorkItemStateLabel({ state, className }: WorkItemStateLabelProps) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2", className)}>
      <PbiStateDot state={state} />
      <span className="truncate">{formatWorkItemStateLabel(state)}</span>
    </span>
  );
}
