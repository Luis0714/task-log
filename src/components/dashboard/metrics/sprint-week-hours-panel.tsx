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
    <div className="flex min-w-0 flex-1 flex-col gap-2 px-3 py-3 sm:px-4">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {week.label}
      </p>

      {loading ? (
        <>
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-1.5 w-full rounded-full" />
          <Skeleton className="h-3 w-full max-w-40" />
        </>
      ) : (
        <>
          <p className="font-heading text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">
            {formatWeekValue(week.hoursCurrent, week.hoursTarget)}
          </p>
          <ProgressBar value={week.hoursCurrent} max={week.hoursTarget} />
          <p className="text-muted-foreground text-xs leading-snug">{hint}</p>
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

  const [firstWeek, secondWeek] = weeks;

  return (
    <Card
      size="sm"
      className={cn(
        "border-border/60 dark:border-white/6 transition-colors hover:border-primary/20 hover:bg-card/95",
        className,
      )}
    >
      <CardContent className="p-0">
        <div className="divide-border/60 grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {firstWeek ? <SprintWeekCell week={firstWeek} loading={loading} /> : null}
          {secondWeek ? <SprintWeekCell week={secondWeek} loading={loading} /> : null}
          {loading && weeks.length === 0 ? (
            <>
              <SprintWeekCell
                week={{
                  label: "1ª semana",
                  hoursCurrent: 0,
                  hoursTarget: 0,
                  workingDaysCount: 0,
                  dateRangeLabel: "",
                }}
                loading
              />
              <SprintWeekCell
                week={{
                  label: "2ª semana",
                  hoursCurrent: 0,
                  hoursTarget: 0,
                  workingDaysCount: 0,
                  dateRangeLabel: "",
                }}
                loading
              />
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
