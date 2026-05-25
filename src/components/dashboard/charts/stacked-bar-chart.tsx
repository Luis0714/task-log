"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { ConfigChartLegend } from "@/components/dashboard/charts/config-chart-legend";
import { ConfigChartTooltip } from "@/components/dashboard/charts/config-chart-tooltip";
import { ChartContainer, ChartLegend, ChartTooltip } from "@/components/ui/chart";
import type { SprintDayHoursPoint } from "@/lib/dashboard/sprint-hours-series";
import {
  CHART_INITIAL_DIMENSION,
  CHART_MARGIN,
  CHART_TOOLTIP_CURSOR,
  CHART_HEIGHT_COMPACT,
  chartContainerClass,
  hoursDailyChartConfig,
} from "@/lib/dashboard/chart-config";
import { formatHours } from "@/lib/dashboard/format-hours";

const DAILY_LEGEND_KEYS = ["taskHours", "bugHours"] as const;

export type StackedBarChartProps = {
  points: readonly SprintDayHoursPoint[];
  selectedDayKey?: string;
  className?: string;
};

export function StackedBarChart({
  points,
  selectedDayKey,
  className,
}: StackedBarChartProps) {
  if (points.length === 0) return null;

  const maxTotal = Math.max(...points.map((p) => p.totalHours), 1);

  return (
    <ChartContainer
      config={hoursDailyChartConfig}
      initialDimension={CHART_INITIAL_DIMENSION}
      className={chartContainerClass(CHART_HEIGHT_COMPACT, className)}
    >
      <BarChart data={[...points]} margin={CHART_MARGIN} barCategoryGap="24%">
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          interval="preserveStartEnd"
          tick={{ fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={28}
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => `${v}h`}
        />
        <ChartTooltip
          cursor={CHART_TOOLTIP_CURSOR}
          content={
            <ConfigChartTooltip
              config={hoursDailyChartConfig}
              formatValue={(value) => formatHours(value)}
            />
          }
        />
        <ChartLegend
          content={
            <ConfigChartLegend config={hoursDailyChartConfig} keys={DAILY_LEGEND_KEYS} />
          }
        />
        <Bar
          dataKey="taskHours"
          name="taskHours"
          stackId="hours"
          fill="var(--color-taskHours)"
          maxBarSize={32}
          animationDuration={650}
        >
          {points.map((point) => {
            const selected = point.dayKey === selectedDayKey;
            const dim = point.totalHours < maxTotal * 0.25 && !selected;
            return (
              <Cell
                key={`task-${point.dayKey}`}
                fillOpacity={selected ? 1 : dim ? 0.55 : 0.85}
                stroke={selected ? "var(--color-taskHours)" : "transparent"}
                strokeWidth={selected ? 2 : 0}
              />
            );
          })}
        </Bar>
        <Bar
          dataKey="bugHours"
          name="bugHours"
          stackId="hours"
          fill="var(--color-bugHours)"
          radius={[5, 5, 0, 0]}
          maxBarSize={32}
          animationDuration={750}
        >
          {points.map((point) => {
            const selected = point.dayKey === selectedDayKey;
            const dim = point.totalHours < maxTotal * 0.25 && !selected;
            return (
              <Cell
                key={`bug-${point.dayKey}`}
                fillOpacity={selected ? 1 : dim ? 0.55 : 0.9}
                stroke={selected ? "var(--color-bugHours)" : "transparent"}
                strokeWidth={selected ? 2 : 0}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
