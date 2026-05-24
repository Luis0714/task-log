import { Clock, Hourglass, Timer } from "lucide-react";

import { MetricProgressCard } from "@/components/dashboard/metrics/metric-progress-card";
import { MetricStatCard } from "@/components/dashboard/metrics/metric-stat-card";
import { PbiStatusBreakdown } from "@/components/dashboard/metrics/pbi-status-breakdown";
import { SprintWeekHoursPanel } from "@/components/dashboard/metrics/sprint-week-hours-panel";
import { formatHours } from "@/lib/dashboard/format-hours";
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
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>
      <div className="flex flex-col gap-3">
        <MetricStatCard
          label={hoursDayLabel}
          value={formatHours(metrics.hoursToday)}
          icon={Clock}
          loading={loading}
        />
        <SprintWeekHoursPanel weeks={metrics.sprintWeeks} loading={loading} />
      </div>
      <MetricProgressCard
        label="Horas sprint"
        current={metrics.hoursSprintCurrent}
        target={metrics.hoursSprintTarget}
        icon={Timer}
        hint={sprintDaysHint}
        loading={loading}
      />
      <MetricStatCard
        label="Horas pendientes"
        value={formatHours(metrics.hoursRemaining)}
        icon={Hourglass}
        hint={sprintDaysHint}
        loading={loading}
      />
      <PbiStatusBreakdown groups={metrics.pbiStateGroups} loading={loading} />
    </div>
  );
}
