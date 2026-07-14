import { Bug, Clock, ListChecks } from "lucide-react";

import { BUG_BAR_OPEN_CLASS } from "@/lib/brand/bug-colors";
import { formatHours } from "@/lib/dashboard/format-hours";
import type { HoursBreakdown } from "@/lib/hours/hours-breakdown";
import { totalHoursBreakdown } from "@/lib/hours/hours-breakdown";
import { cn } from "@/lib/utils";

export type HoursBreakdownStripProps = {
  breakdown: HoursBreakdown;
  /** Muestra tasks/bugs en 0h aunque no haya horas registradas */
  showWhenEmpty?: boolean;
  /** Horas pendientes (capacidad restante) en la misma fila que task/bug */
  pendingHours?: number;
  className?: string;
};

export function HoursBreakdownStrip({
  breakdown,
  showWhenEmpty = false,
  pendingHours,
  className,
}: HoursBreakdownStripProps) {
  const total = totalHoursBreakdown(breakdown);
  const showPending = pendingHours !== undefined;
  if (total <= 0 && !showWhenEmpty && !showPending) return null;

  const taskPercent =
    total > 0 ? Math.round((breakdown.taskHours / total) * 100) : 0;
  const bugPercent = total > 0 ? 100 - taskPercent : 0;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="bg-muted flex h-1 w-full overflow-hidden rounded-full">
        {total > 0 ? (
          <div className="flex h-full w-full">
            <div className="bg-chart-1 h-full" style={{ width: `${taskPercent}%` }} />
            <div className={cn(BUG_BAR_OPEN_CLASS, "h-full")} style={{ width: `${bugPercent}%` }} />
          </div>
        ) : null}
      </div>
      <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
        <span className="inline-flex items-center gap-1">
          <ListChecks className="text-chart-1 size-3 shrink-0" aria-hidden />
          <span className="tabular-nums">{formatHours(breakdown.taskHours)}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Bug
            className="text-bug-open size-3 shrink-0"
            style={{ color: "var(--bug-open)" }}
            aria-hidden
          />
          <span className="tabular-nums">{formatHours(breakdown.bugHours)}</span>
        </span>
        {showPending ? (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3 shrink-0 text-primary/80" aria-hidden />
            <span className="tabular-nums">{formatHours(pendingHours)}</span>
            <span>pend.</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
