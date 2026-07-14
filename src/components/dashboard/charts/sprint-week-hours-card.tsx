"use client";

import { HoursBreakdownStrip } from "@/components/dashboard/charts/hours-breakdown-strip";
import { ProgressBar } from "@/components/dashboard/metrics/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatHours } from "@/lib/dashboard/format-hours";
import { totalHoursBreakdown } from "@/lib/hours/hours-breakdown";
import type { SprintWeekMetrics } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

export type SprintWeekHoursCardProps = {
  week: SprintWeekMetrics;
  active: boolean;
  loading?: boolean;
};

export function SprintWeekHoursCard({
  week,
  active,
  loading = false,
}: SprintWeekHoursCardProps) {
  const total = totalHoursBreakdown(week.hours);
  const dayLabel =
    week.workingDaysCount === 1 ? "día laborable" : "días laborables";

  if (loading) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-border/60 p-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-1.5 w-full" />
        <Skeleton className="h-3 w-full" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-3 transition-colors",
        active
          ? "border-primary/35 bg-primary/[0.04] ring-1 ring-primary/15"
          : "border-border/60 bg-card/50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
            {week.label}
          </p>
          {week.dateRangeLabel ? (
            <p className="text-muted-foreground truncate text-[10px]">{week.dateRangeLabel}</p>
          ) : null}
        </div>
        <span className="text-muted-foreground shrink-0 text-[10px] tabular-nums">
          {week.workingDaysCount} {dayLabel}
        </span>
      </div>

      <p className="font-heading text-xl font-semibold tracking-tight tabular-nums">
        {formatHours(total)}{" "}
        <span className="text-muted-foreground text-sm font-normal">
          / {formatHours(week.hoursTarget)}
        </span>
      </p>

      <ProgressBar value={total} max={week.hoursTarget} className="h-2" />

      <HoursBreakdownStrip
        breakdown={week.hours}
        showWhenEmpty
        className="gap-1.5"
      />
    </div>
  );
}
