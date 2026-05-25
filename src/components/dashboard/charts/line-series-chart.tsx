"use client";

import { Area, AreaChart, CartesianGrid, Line, ReferenceDot, XAxis, YAxis } from "recharts";

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
  hoursTrendChartConfig,
} from "@/lib/dashboard/chart-config";
import { formatHours } from "@/lib/dashboard/format-hours";
import { getHoursPaceStatus } from "@/lib/dashboard/hours-pace";
import { cn } from "@/lib/utils";

const MARGIN = { top: 10, right: 10, left: -16, bottom: 0 };

export type LineSeriesChartProps = {
  points: readonly SprintDayHoursPoint[];
  className?: string;
};

export function LineSeriesChart({ points, className }: LineSeriesChartProps) {
  if (points.length === 0) return null;

  const pace = getHoursPaceStatus(points);
  const last = points[points.length - 1];
  const behind = pace === "behind";

  return (
    <ChartContainer
      config={hoursTrendChartConfig}
      className={cn(CHART_HEIGHT_COMPACT, "w-full", className)}
    >
      <AreaChart data={[...points]} margin={MARGIN}>
        <defs>
          <linearGradient id="hoursActualFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-cumulativeHours)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--color-cumulativeHours)" stopOpacity={0.03} />
          </linearGradient>
        </defs>
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
          width={30}
          tick={{ fontSize: 10 }}
          tickFormatter={(value) => `${value}h`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <span className="font-mono tabular-nums">
                  {formatHours(Number(value))} ·{" "}
                  {hoursTrendChartConfig[name as keyof typeof hoursTrendChartConfig]?.label ?? name}
                </span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          type="monotone"
          dataKey="cumulativeHours"
          stroke="var(--color-cumulativeHours)"
          fill="url(#hoursActualFill)"
          strokeWidth={2.5}
          dot={{ r: 2.5, fill: "var(--color-cumulativeHours)", strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
          animationDuration={800}
        />
        <Line
          type="monotone"
          dataKey="idealCumulativeHours"
          stroke="var(--color-idealCumulativeHours)"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          dot={false}
          opacity={0.85}
        />
        {last ? (
          <ReferenceDot
            x={last.label}
            y={last.cumulativeHours}
            r={6}
            fill={behind ? "var(--chart-4)" : "var(--chart-1)"}
            stroke="hsl(var(--background))"
            strokeWidth={2}
          />
        ) : null}
      </AreaChart>
    </ChartContainer>
  );
}
