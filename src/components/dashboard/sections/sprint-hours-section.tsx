"use client";

import { ChartPanel } from "@/components/dashboard/charts/chart-panel";
import { DashboardKpi } from "@/components/dashboard/charts/dashboard-kpi";
import { HoursMixChart } from "@/components/dashboard/charts/hours-mix-chart";
import { LineSeriesChart } from "@/components/dashboard/charts/line-series-chart";
import { SprintWeekHoursPanel } from "@/components/dashboard/charts/sprint-week-hours-panel";
import { StackedBarChart } from "@/components/dashboard/charts/stacked-bar-chart";
import { formatHours } from "@/lib/dashboard/format-hours";
import { totalHoursBreakdown } from "@/lib/dashboard/hours-breakdown";
import {
  formatWorkingDaysHint,
  HOURS_PER_SPRINT_WORKING_DAY,
} from "@/lib/dashboard/sprint-hours";
import { getHoursPaceStatus } from "@/lib/dashboard/hours-pace";
import type { DashboardMetrics } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

export type SprintHoursSectionProps = {
  metrics: DashboardMetrics;
  hoursDayLabel?: string;
  selectedDayKey?: string;
  loading?: boolean;
  className?: string;
};

export function SprintHoursSection({
  metrics,
  hoursDayLabel = "Horas hoy",
  selectedDayKey = "",
  loading = false,
  className,
}: SprintHoursSectionProps) {
  const hoursToday = totalHoursBreakdown(metrics.hoursToday);
  const hoursSprint = totalHoursBreakdown(metrics.hoursSprintCurrent);
  const hasDaySeries = metrics.hoursByDay.length > 0;
  const pace = getHoursPaceStatus(metrics.hoursByDay);
  const todayProgress = Math.round((hoursToday / HOURS_PER_SPRINT_WORKING_DAY) * 100);
  const sprintProgress = Math.round((hoursSprint / metrics.hoursSprintTarget) * 100);
  const todayLow = hoursToday > 0 && hoursToday < HOURS_PER_SPRINT_WORKING_DAY * 0.5;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-12">
        <DashboardKpi
          label={hoursDayLabel}
          value={`${formatHours(hoursToday)} / ${HOURS_PER_SPRINT_WORKING_DAY}h`}
          progress={todayProgress}
          variant={todayLow ? "warning" : todayProgress >= 100 ? "success" : "default"}
          highlight
          className="lg:col-span-3"
          loading={loading}
        />
        <DashboardKpi
          label="Horas sprint"
          value={`${formatHours(hoursSprint)} / ${formatHours(metrics.hoursSprintTarget)}`}
          progress={sprintProgress}
          variant={pace === "behind" ? "warning" : pace === "ahead" ? "success" : "accent"}
          hint={formatWorkingDaysHint(metrics.sprintWorkingDaysCount)}
          className="lg:col-span-3"
          loading={loading}
        />
        <DashboardKpi
          label="Pendientes"
          value={formatHours(metrics.hoursRemaining)}
          hint="Capacidad restante"
          variant={metrics.hoursRemaining <= 8 ? "accent" : "default"}
          className="lg:col-span-2"
          loading={loading}
        />
        <ChartPanel
          title="Mix task / bug"
          size="inline"
          loading={loading}
          className="sm:col-span-2 lg:col-span-4"
        >
          <HoursMixChart breakdown={metrics.hoursSprintCurrent} />
        </ChartPanel>
      </div>

      <SprintWeekHoursPanel
        weeks={metrics.sprintWeeks}
        selectedDayKey={selectedDayKey}
        loading={loading}
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartPanel
          title="Ritmo acumulado"
          size="compact"
          loading={loading}
          isEmpty={!hasDaySeries}
          emptyMessage="Sin días laborables en el sprint."
          highlight={pace === "behind"}
        >
          <LineSeriesChart points={metrics.hoursByDay} />
        </ChartPanel>

        <ChartPanel
          title="Horas por día"
          size="compact"
          loading={loading}
          isEmpty={!hasDaySeries}
          emptyMessage="Sin días laborables en el sprint."
          highlight={Boolean(selectedDayKey)}
        >
          <StackedBarChart
            points={metrics.hoursByDay}
            selectedDayKey={selectedDayKey}
          />
        </ChartPanel>
      </div>
    </div>
  );
}
