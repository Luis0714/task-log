"use client";

import { ChartPanel } from "@/components/dashboard/charts/chart-panel";
import { DashboardKpi } from "@/components/dashboard/charts/dashboard-kpi";
import { HoursMixChart } from "@/components/dashboard/charts/hours-mix-chart";
import { LineSeriesChart } from "@/components/dashboard/charts/line-series-chart";
import { SprintWeekHoursPanel } from "@/components/dashboard/charts/sprint-week-hours-panel";
import { StackedBarChart } from "@/components/dashboard/charts/stacked-bar-chart";
import { formatHours } from "@/lib/dashboard/format-hours";
import { totalHoursBreakdown } from "@/lib/hours/hours-breakdown";
import { getHoursPaceStatus } from "@/lib/dashboard/hours-pace";
import { kpiProgressPercent, resolveHoursKpiVariant } from "@/lib/dashboard/kpi-variant";
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
  const hasDaySeries = metrics.hoursByDay.length > 0;
  const hasHolidaySeries = metrics.hoursByDay.some((point) => point.isHoliday);
  const pace = getHoursPaceStatus(metrics.hoursByDay);
  const todayVariant: DashboardKpiVariant = resolveHoursKpiVariant(
    hoursToday,
    metrics.hoursDayTarget,
  );
  const sprintVariantBase: KpiVariant = resolveHoursKpiVariant(
    hoursSprint,
    metrics.hoursSprintTarget,
  );

  const sprintVariantResolved: DashboardKpiVariant =
    sprintVariantBase === "destructive" || sprintVariantBase === "success"
      ? sprintVariantBase
      : pace === "behind"
        ? "warning"
        : pace === "ahead"
          ? "accent"
          : sprintVariantBase;

  const sprintDayLabel = `${metrics.sprintWorkingDaysCount} ${
    metrics.sprintWorkingDaysCount === 1 ? "día laborable" : "días laborables"
  }`;
  const dayAssignmentHint = `Asignación ${metrics.hoursDayAssignmentPct}%`;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-12">
        <DashboardKpi
          size="compact"
          layout="stack"
          label={hoursDayLabel}
          value={`${formatHours(hoursToday)} / ${formatHours(metrics.hoursDayTarget)}`}
          progress={kpiProgressPercent(hoursToday, metrics.hoursDayTarget)}
          hoursBreakdown={metrics.hoursToday}
          hoursPending={metrics.hoursDayPending}
          variant={todayVariant}
          highlight={todayVariant === "success" || todayVariant === "destructive"}
          className="min-w-0 lg:col-span-4"
          loading={loading}
          hint={dayAssignmentHint}
          hintPlacement="top"
        />
        <DashboardKpi
          size="compact"
          layout="stack"
          label="Sprint completo"
          labelClassName="uppercase tracking-wide"
          sublabel={metrics.sprintDateRangeLabel}
          value={`${formatHours(hoursSprint)} / ${formatHours(metrics.hoursSprintTarget)}`}
          progress={kpiProgressPercent(hoursSprint, metrics.hoursSprintTarget)}
          hoursBreakdown={metrics.hoursSprintCurrent}
          hoursPending={metrics.hoursRemaining}
          variant={sprintVariantResolved}
          highlight={sprintVariantResolved === "destructive" || sprintVariantResolved === "success"}
          className="min-w-0 lg:col-span-4"
          loading={loading}
          hint={sprintDayLabel}
          hintPlacement="top"
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
      {hasHolidaySeries ? (
        <p className="text-muted-foreground text-[11px]">
          Los días <strong>festivos</strong> (resaltados en negrita) no afectan el
          ritmo acumulado ni las horas esperadas del sprint.
        </p>
      ) : null}
    </div>
  );
}