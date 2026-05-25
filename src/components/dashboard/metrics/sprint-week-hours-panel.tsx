import { ProgressBar } from "@/components/dashboard/metrics/progress-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatHours } from "@/lib/dashboard/format-hours";
import type { SprintWeekMetrics } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

function formatWeekValue(current: number, target: number): string {
  return `${formatHours(current)} / ${formatHours(target)}`;
}

type SprintWeekCellProps = {
  week: SprintWeekMetrics;
  loading?: boolean;
};

function SprintWeekCell({ week, loading = false }: SprintWeekCellProps) {
  const hint = `${week.workingDaysCount} ${
    week.workingDaysCount === 1 ? "día laborable" : "días laborables"
  }${week.dateRangeLabel ? ` · ${week.dateRangeLabel}` : ""}`;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {week.label}
      </p>

      {loading ? (
        <>
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-1.5 w-full rounded-full" />
          <Skeleton className="h-3 w-full max-w-40" />
        </>
      ) : (
        <>
          <p className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
            {formatWeekValue(week.hoursCurrent, week.hoursTarget)}
          </p>
          <ProgressBar value={week.hoursCurrent} max={week.hoursTarget} />
          {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
        </>
      )}
    </div>
  );
}

export type SprintWeekHoursPanelProps = {
  weeks: SprintWeekMetrics[];
  loading?: boolean;
  className?: string;
};

export function SprintWeekHoursPanel({
  weeks,
  loading = false,
  className,
}: SprintWeekHoursPanelProps) {
  if (!loading && weeks.length === 0) return null;

  const displayWeeks =
    loading && weeks.length === 0
      ? [
          {
            label: "1ª semana",
            hoursCurrent: 0,
            hoursTarget: 0,
            workingDaysCount: 0,
            dateRangeLabel: "",
          },
          {
            label: "2ª semana",
            hoursCurrent: 0,
            hoursTarget: 0,
            workingDaysCount: 0,
            dateRangeLabel: "",
          },
        ]
      : weeks;

  return (
    <Card
      size="sm"
      className={cn(
        "border-border/60 dark:border-white/6 transition-colors hover:border-primary/20 hover:bg-card/95",
        className,
      )}
    >
      <CardContent className="flex flex-col gap-3 pt-0">
        <div
          className={cn(
            "grid gap-3",
            displayWeeks.length > 1 && "sm:grid-cols-2",
          )}
        >
          {displayWeeks.map((week) => (
            <SprintWeekCell key={week.label} week={week} loading={loading} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
