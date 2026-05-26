"use client";

import { Cell, Pie, PieChart } from "recharts";

import { ConfigChartTooltip } from "@/components/dashboard/charts/config-chart-tooltip";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { formatHours } from "@/lib/dashboard/format-hours";
import type { HoursBreakdown } from "@/lib/dashboard/hours-breakdown";
import { totalHoursBreakdown } from "@/lib/dashboard/hours-breakdown";
import { BUG_BAR_OPEN_CLASS } from "@/lib/brand/bug-colors";
import {
  CHART_HEIGHT_INLINE,
  chartContainerClass,
  hoursMixChartConfig,
} from "@/lib/dashboard/chart-config";
import { cn } from "@/lib/utils";

export type HoursMixChartProps = {
  breakdown: HoursBreakdown;
  className?: string;
};

export function HoursMixChart({ breakdown, className }: HoursMixChartProps) {
  const total = totalHoursBreakdown(breakdown);
  if (total <= 0) {
    return <p className="text-muted-foreground text-sm">Sin horas registradas en el sprint.</p>;
  }

  const slices = [
    { key: "taskHours", value: breakdown.taskHours },
    { key: "bugHours", value: breakdown.bugHours },
  ].filter((slice) => slice.value > 0);

  const taskPercent = Math.round((breakdown.taskHours / total) * 100);
  const bugPercent = 100 - taskPercent;
  const bugHeavy = taskPercent < 60;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <ChartContainer
        config={hoursMixChartConfig}
        className={chartContainerClass(CHART_HEIGHT_INLINE, "w-[100px] shrink-0")}
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
          <Pie
            data={slices}
            dataKey="value"
            nameKey="key"
            innerRadius={34}
            outerRadius={48}
            paddingAngle={4}
            cornerRadius={5}
            strokeWidth={2}
            stroke="hsl(var(--background))"
            animationDuration={700}
          >
            {slices.map((slice) => (
              <Cell key={slice.key} fill={`var(--color-${slice.key})`} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-heading flex flex-wrap items-baseline gap-x-1.5 gap-y-0 text-lg font-semibold tabular-nums leading-none">
          <span>
            <span className={bugHeavy ? "text-amber-600 dark:text-amber-400" : "text-primary"}>
              {taskPercent}%
            </span>
            <span className="text-muted-foreground text-sm font-normal"> tareas</span>
          </span>
          <span aria-hidden className="text-muted-foreground text-sm font-normal">
            ·
          </span>
          <span>
            <span
              className="text-bug-open tabular-nums"
              style={{ color: "var(--bug-open)" }}
            >
              {bugPercent}%
            </span>
            <span className="text-muted-foreground text-sm font-normal"> defectos</span>
          </span>
        </p>
        <p className="text-muted-foreground text-xs leading-snug">
          {formatHours(breakdown.taskHours)} dev · {formatHours(breakdown.bugHours)} defectos
        </p>
        <div className="flex gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="bg-chart-1 size-1.5 rounded-full" />
            Tareas
          </span>
          <span className="flex items-center gap-1">
            <span
              className={cn(BUG_BAR_OPEN_CLASS, "size-1.5 shrink-0 rounded-full")}
              style={{ backgroundColor: "var(--bug-open)" }}
              aria-hidden
            />
            {hoursMixChartConfig.bugHours.label}
          </span>
        </div>
      </div>
    </div>
  );
}
