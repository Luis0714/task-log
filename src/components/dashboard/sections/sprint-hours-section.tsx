"use client";

import { ChartPanel } from "@/components/dashboard/charts/chart-panel";
import { DashboardKpi } from "@/components/dashboard/charts/dashboard-kpi";
import { HoursMixChart } from "@/components/dashboard/charts/hours-mix-chart";
import { LineSeriesChart } from "@/components/dashboard/charts/line-series-chart";
import { SprintWeekHoursPanel } from "@/components/dashboard/charts/sprint-week-hours-panel";
import { StackedBarChart } from "@/components/dashboard/charts/stacked-bar-chart";
import { formatHours } from "@/lib/dashboard/format-hours";
import { totalHoursBreakdown } from "@/lib/dashboard/hours-breakdown";
import { HOURS_PER_SPRINT_WORKING_DAY } from "@/lib/dashboard/sprint-hours";
import { getHoursPaceStatus } from "@/lib/dashboard/hours-pace";
import { kpiProgressPercent } from "@/lib/dashboard/kpi-variant";
import { resolveProgressStatus } from "@/lib/dashboard/progress-status";
import type { DashboardMetrics } from "@/lib/dashboard/types";
import type { DashboardKpiVariant } from "@/components/dashboard/charts/dashboard-kpi";
import type { KpiVariant } from "@/lib/dashboard/kpi-variant";
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
  const hoursDayPending = Math.max(
    0,
    Math.round((HOURS_PER_SPRINT_WORKING_DAY - hoursToday) * 10) / 10,
  );
  const hasDaySeries = metrics.hoursByDay.length > 0;
  const pace = getHoursPaceStatus(metrics.hoursByDay);
  const todayStatus = resolveProgressStatus(
    hoursToday,
    HOURS_PER_SPRINT_WORKING_DAY,
  );
  const todayVariant: DashboardKpiVariant =
    todayStatus === "over"
      ? "destructive"
      : todayStatus === "complete"
        ? "success"
        : "default";
  const sprintStatus = resolveProgressStatus(hoursSprint, metrics.hoursSprintTarget);
  const sprintVariant: KpiVariant =
    sprintStatus === "over"
      ? "destructive"
      : sprintStatus === "complete"
        ? "success"
        : pace === "behind"
          ? "warning"
          : pace === "ahead"
            ? "accent"
            : "default";

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-12">
        <DashboardKpi
          size="compact"
          layout="stack"
          label={hoursDayLabel}
          value={`${formatHours(hoursToday)} / ${HOURS_PER_SPRINT_WORKING_DAY}h`}
          progress={kpiProgressPercent(hoursToday, HOURS_PER_SPRINT_WORKING_DAY)}
          hoursBreakdown={metrics.hoursToday}
          hoursPending={hoursDayPending}
          variant={todayVariant}
          highlight={todayVariant === "success" || todayVariant === "destructive"}
          className="min-w-0 lg:col-span-4"
          loading={loading}
        />
        <DashboardKpi
          size="compact"
          layout="stack"
          label="Horas sprint"
          value={`${formatHours(hoursSprint)} / ${formatHours(metrics.hoursSprintTarget)}`}
          progress={kpiProgressPercent(hoursSprint, metrics.hoursSprintTarget)}
          hoursBreakdown={metrics.hoursSprintCurrent}
          hoursPending={metrics.hoursRemaining}
          variant={sprintVariant}
          highlight={sprintVariant === "destructive" || sprintVariant === "success"}
          className="min-w-0 lg:col-span-4"
          loading={loading}
        />
        <ChartPanel
          title="Mezcla tarea / Bug"
          size="inline"
          loading={loading}
          className="col-span-2 min-w-0 lg:col-span-4"
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
