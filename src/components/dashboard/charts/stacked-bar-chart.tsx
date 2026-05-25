"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { SprintDayHoursPoint } from "@/lib/dashboard/sprint-hours-series";
import {
  CHART_HEIGHT_COMPACT,
  hoursDailyChartConfig,
} from "@/lib/dashboard/chart-config";
import { formatHours } from "@/lib/dashboard/format-hours";
import {
  ChartGradientDefs,
  gradientFill,
  HOURS_BUG_GRADIENT,
  HOURS_TASK_GRADIENT,
} from "@/lib/dashboard/chart-gradients";
import { cn } from "@/lib/utils";

const MARGIN = { top: 10, right: 8, left: -16, bottom: 0 };

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
      className={cn(CHART_HEIGHT_COMPACT, "w-full", className)}
    >
      <BarChart data={[...points]} margin={MARGIN} barCategoryGap="24%">
        <ChartGradientDefs gradients={[HOURS_TASK_GRADIENT, HOURS_BUG_GRADIENT]} />
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          interval="preserveStartEnd"
          tick={{ fontSize: 10 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={28}
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => `${v}h`}
        />
        <ChartTooltip
          cursor={{ fill: "hsl(var(--primary))", opacity: 0.08 }}
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <span className="font-mono tabular-nums">
                  {formatHours(Number(value))} ·{" "}
                  {hoursDailyChartConfig[name as keyof typeof hoursDailyChartConfig]?.label ?? name}
                </span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="taskHours"
          stackId="hours"
          fill={gradientFill(HOURS_TASK_GRADIENT.id)}
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
                stroke={selected ? "var(--chart-1)" : "transparent"}
                strokeWidth={selected ? 2 : 0}
              />
            );
          })}
        </Bar>
        <Bar
          dataKey="bugHours"
          stackId="hours"
          fill={gradientFill(HOURS_BUG_GRADIENT.id)}
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
                stroke={selected ? "var(--chart-4)" : "transparent"}
                strokeWidth={selected ? 2 : 0}
              />
            );
          })}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
