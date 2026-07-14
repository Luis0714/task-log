"use client";

import { Bug, ListChecks } from "lucide-react";
import { Pie, PieChart } from "recharts";

import { HoursMixMetricColumn } from "@/components/dashboard/charts/hours-mix-metric-column";
import { ConfigChartTooltip } from "@/components/dashboard/charts/config-chart-tooltip";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { formatHours } from "@/lib/dashboard/format-hours";
import type { HoursBreakdown } from "@/lib/hours/hours-breakdown";
import { totalHoursBreakdown } from "@/lib/hours/hours-breakdown";
import { BUG_ICON_OPEN_CLASS } from "@/lib/brand/bug-colors";
import {
  CHART_HEIGHT_INLINE,
  CHART_WIDTH_INLINE_RING,
  INLINE_PIE_RING,
  chartContainerClass,
  hoursMixChartConfig,
} from "@/lib/dashboard/chart-config";
import { cn } from "@/lib/utils";

export type HoursMixChartProps = Readonly<{
  breakdown: HoursBreakdown;
  className?: string;
}>;

export function HoursMixChart({ breakdown, className }: HoursMixChartProps) {
  const total = totalHoursBreakdown(breakdown);
  if (total <= 0) {
    return <p className="text-muted-foreground text-sm">Sin horas registradas en el sprint.</p>;
  }

  const slices = [
    { key: "taskHours", value: breakdown.taskHours, fill: "var(--color-taskHours)" },
    { key: "bugHours", value: breakdown.bugHours, fill: "var(--color-bugHours)" },
  ].filter((slice) => slice.value > 0);

  const taskPercent = Math.round((breakdown.taskHours / total) * 100);
  const bugPercent = 100 - taskPercent;
  const bugHeavy = taskPercent < 60;
  const bugIconClass = cn(BUG_ICON_OPEN_CLASS, "size-3.5 shrink-0");

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 text-center",
        "lg:flex-row lg:items-center lg:gap-3",
        className,
      )}
    >
      <div className="flex shrink-0 items-center justify-center">
        <ChartContainer
          config={hoursMixChartConfig}
          className={chartContainerClass(
            CHART_HEIGHT_INLINE,
            cn(CHART_WIDTH_INLINE_RING, "shrink-0"),
          )}
        >
          <PieChart>
            <ChartTooltip
              content={
                <ConfigChartTooltip
                  config={hoursMixChartConfig}
                  formatValue={(value) => formatHours(value)}
                />
              }
            />
            <Pie data={slices} dataKey="value" nameKey="key" {...INLINE_PIE_RING} />
          </PieChart>
        </ChartContainer>
      </div>

      <div className="flex w-full max-w-44 items-stretch justify-center gap-2 lg:max-w-none lg:min-w-0 lg:flex-1">
        <HoursMixMetricColumn>
          <span className="inline-flex items-center justify-center gap-1">
            <span
              className={cn(
                "font-heading text-lg font-semibold tabular-nums leading-none",
                bugHeavy ? "text-amber-600 dark:text-amber-400" : "text-primary",
              )}
            >
              {taskPercent}%
            </span>
            <ListChecks className="text-chart-1 size-3.5 shrink-0" aria-hidden />
          </span>
          <span className="text-muted-foreground inline-flex items-center justify-center gap-1 text-xs">
            <ListChecks className="text-chart-1 size-3 shrink-0" aria-hidden />
            <span className="tabular-nums">{formatHours(breakdown.taskHours)}</span>
          </span>
          <span className="text-muted-foreground inline-flex items-center justify-center gap-1 text-[10px]">
            <ListChecks className="text-chart-1 size-3 shrink-0" aria-hidden />
            Desarrollo
          </span>
        </HoursMixMetricColumn>

        <HoursMixMetricColumn>
          <span className="inline-flex items-center justify-center gap-1">
            <span
              className="font-heading text-lg font-semibold leading-none tabular-nums"
              style={{ color: "var(--bug-open)" }}
            >
              {bugPercent}%
            </span>
            <Bug className={bugIconClass} style={{ color: "var(--bug-open)" }} aria-hidden />
          </span>
          <span className="text-muted-foreground inline-flex items-center justify-center gap-1 text-xs">
            <Bug className={bugIconClass} style={{ color: "var(--bug-open)" }} aria-hidden />
            <span className="tabular-nums">{formatHours(breakdown.bugHours)}</span>
          </span>
          <span className="text-muted-foreground inline-flex items-center justify-center gap-1 text-[10px]">
            <Bug className={bugIconClass} style={{ color: "var(--bug-open)" }} aria-hidden />
            Bugs
          </span>
        </HoursMixMetricColumn>
      </div>
    </div>
  );
}
