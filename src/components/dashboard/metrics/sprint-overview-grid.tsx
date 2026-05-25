import { Clock, Timer } from "lucide-react";

import { MetricProgressCard } from "@/components/dashboard/metrics/metric-progress-card";
import { PbiStatusBreakdown } from "@/components/dashboard/metrics/pbi-status-breakdown";
import { SprintWeekHoursPanel } from "@/components/dashboard/metrics/sprint-week-hours-panel";
import { formatHours } from "@/lib/dashboard/format-hours";
import { totalHoursBreakdown } from "@/lib/dashboard/hours-breakdown";
import { HOURS_PER_SPRINT_WORKING_DAY } from "@/lib/dashboard/sprint-hours";
import { formatWorkingDaysHint } from "@/lib/dashboard/sprint-weeks";
import type { DashboardMetrics } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

export type SprintOverviewGridProps = {
  metrics: DashboardMetrics;
  hoursDayLabel?: string;
  loading?: boolean;
  className?: string;
};

export function SprintOverviewGrid({
  metrics,
  hoursDayLabel = "Horas hoy",
  loading = false,
  className,
}: SprintOverviewGridProps) {
  const sprintDaysHint = formatWorkingDaysHint(metrics.sprintWorkingDaysCount);

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      <div className="flex flex-col gap-3">
        <MetricProgressCard
          label={hoursDayLabel}
          current={totalHoursBreakdown(metrics.hoursToday)}
          target={HOURS_PER_SPRINT_WORKING_DAY}
          hoursBreakdown={metrics.hoursToday}
          icon={Clock}
          loading={loading}
        />
        <SprintWeekHoursPanel weeks={metrics.sprintWeeks} loading={loading} />
      </div>
      <MetricProgressCard
        label="Horas sprint"
        current={totalHoursBreakdown(metrics.hoursSprintCurrent)}
        target={metrics.hoursSprintTarget}
        hoursBreakdown={metrics.hoursSprintCurrent}
        icon={Timer}
        hint={sprintDaysHint}
        footer={
          loading ? null : (
            <div className="flex flex-col gap-1.5">
              <p className="text-muted-foreground text-xs">
                <span className="text-foreground font-heading font-semibold tabular-nums">
                  {formatHours(metrics.hoursRemaining)}
                </span>{" "}
                pendientes
              </p>
            </div>
          )
        }
        loading={loading}
      />
      <PbiStatusBreakdown
        groups={metrics.pbiStateGroups}
        loading={loading}
        className="sm:col-span-2"
      />
    </div>
  );
}
