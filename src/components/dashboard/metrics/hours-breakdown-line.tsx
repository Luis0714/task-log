import { Bug, ListChecks } from "lucide-react";

import { formatHours } from "@/lib/dashboard/format-hours";
import type { HoursBreakdown } from "@/lib/dashboard/hours-breakdown";
import { cn } from "@/lib/utils";

export type HoursBreakdownLineProps = {
  breakdown: HoursBreakdown;
  className?: string;
};

export function HoursBreakdownLine({ breakdown, className }: HoursBreakdownLineProps) {
  if (breakdown.taskHours <= 0 && breakdown.bugHours <= 0) return null;

  return (
    <div
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        <Bug className="size-3 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden />
        <span className="tabular-nums">{formatHours(breakdown.bugHours)}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <ListChecks className="size-3 shrink-0 text-primary" aria-hidden />
        <span className="tabular-nums">{formatHours(breakdown.taskHours)}</span>
      </span>
    </div>
  );
}
