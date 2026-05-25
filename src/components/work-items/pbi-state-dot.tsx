import { getPbiStateColorPresentation } from "@/lib/work-items/pbi-state-colors";
import { cn } from "@/lib/utils";

export type PbiStateDotProps = {
  state: string;
  className?: string;
};

/** Indicador circular del color del estado (filtros, leyendas, listas). */
export function PbiStateDot({ state, className }: PbiStateDotProps) {
  const { dotClassName } = getPbiStateColorPresentation(state);

  return (
    <span
      className={cn("size-2 shrink-0 rounded-full", dotClassName, className)}
      aria-hidden
    />
  );
}
