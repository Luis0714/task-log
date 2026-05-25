"use client";

import { Bug, ListChecks } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

import { ProgressBar } from "@/components/dashboard/metrics/progress-bar";
import { ChartPanel } from "@/components/dashboard/charts/chart-panel";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatHours } from "@/lib/dashboard/format-hours";
import { totalHoursBreakdown, type HoursBreakdown } from "@/lib/dashboard/hours-breakdown";
import {
  ChartGradientDefs,
  gradientFill,
  HOURS_BUG_GRADIENT,
  HOURS_TASK_GRADIENT,
} from "@/lib/dashboard/chart-gradients";
import { hoursDailyChartConfig } from "@/lib/dashboard/chart-config";
import { weekContainsDay } from "@/lib/dashboard/sprint-weeks";
import type { SprintWeekMetrics } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

const weekChartConfig = hoursDailyChartConfig;

type WeekCardProps = {
  week: SprintWeekMetrics;
  active: boolean;
  loading?: boolean;
};

function weekBarData(hours: HoursBreakdown) {
  return [{ name: "hours", taskHours: hours.taskHours, bugHours: hours.bugHours }];
}

function WeekCard({ week, active, loading = false }: WeekCardProps) {
  const total = totalHoursBreakdown(week.hours);
  const dayLabel =
    week.workingDaysCount === 1 ? "día laborable" : "días laborables";

  if (loading) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-border/60 p-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-1.5 w-full" />
        <Skeleton className="h-12 w-full" />
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

      {total > 0 ? (
        <>
          <ChartContainer
            config={weekChartConfig}
            className="h-[52px] w-full"
          >
            <BarChart
              data={weekBarData(week.hours)}
              layout="vertical"
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              barSize={14}
            >
              <ChartGradientDefs gradients={[HOURS_TASK_GRADIENT, HOURS_BUG_GRADIENT]} />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel indicator="dot" />}
              />
              <Bar dataKey="taskHours" stackId="w" fill={gradientFill(HOURS_TASK_GRADIENT.id)} radius={[0, 0, 0, 0]} />
              <Bar dataKey="bugHours" stackId="w" fill={gradientFill(HOURS_BUG_GRADIENT.id)} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>

          <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
            <span className="inline-flex items-center gap-1">
              <ListChecks className="text-chart-1 size-3 shrink-0" aria-hidden />
              <span className="tabular-nums">{formatHours(week.hours.taskHours)}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Bug className="text-chart-4 size-3 shrink-0" aria-hidden />
              <span className="tabular-nums">{formatHours(week.hours.bugHours)}</span>
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}

export type SprintWeekHoursPanelProps = {
  weeks: SprintWeekMetrics[];
  selectedDayKey?: string;
  loading?: boolean;
  className?: string;
};

export function SprintWeekHoursPanel({
  weeks,
  selectedDayKey = "",
  loading = false,
  className,
}: SprintWeekHoursPanelProps) {
  const displayWeeks =
    loading && weeks.length === 0
      ? [
          {
            label: "1ª semana",
            hours: { taskHours: 0, bugHours: 0 },
            hoursTarget: 0,
            workingDaysCount: 0,
            dateRangeLabel: "",
            dayKeys: [],
          },
          {
            label: "2ª semana",
            hours: { taskHours: 0, bugHours: 0 },
            hoursTarget: 0,
            workingDaysCount: 0,
            dateRangeLabel: "",
            dayKeys: [],
          },
        ]
      : weeks;

  if (!loading && displayWeeks.length === 0) return null;

  return (
    <ChartPanel
      title="Horas por semana"
      size="compact"
      loading={loading}
      className={className}
      highlight={displayWeeks.some((w) => weekContainsDay(w, selectedDayKey))}
    >
      <div
        className={cn(
          "grid gap-2",
          displayWeeks.length > 1 ? "sm:grid-cols-2" : "grid-cols-1",
        )}
      >
        {displayWeeks.map((week) => (
          <WeekCard
            key={week.label}
            week={week}
            active={Boolean(selectedDayKey && weekContainsDay(week, selectedDayKey))}
            loading={loading}
          />
        ))}
      </div>
    </ChartPanel>
  );
}
