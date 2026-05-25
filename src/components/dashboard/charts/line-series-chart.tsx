"use client";

import { Area, AreaChart, CartesianGrid, Line, ReferenceDot, XAxis, YAxis } from "recharts";

import { ConfigChartLegend } from "@/components/dashboard/charts/config-chart-legend";
import { ConfigChartTooltip } from "@/components/dashboard/charts/config-chart-tooltip";
import { ChartContainer, ChartLegend, ChartTooltip } from "@/components/ui/chart";
import type { SprintDayHoursPoint } from "@/lib/dashboard/sprint-hours-series";
import {
  CHART_HEIGHT_COMPACT,
  CHART_INITIAL_DIMENSION,
  CHART_MARGIN,
  CHART_TOOLTIP_CURSOR,
  chartContainerClass,
  hoursTrendChartConfig,
} from "@/lib/dashboard/chart-config";
import { formatHours } from "@/lib/dashboard/format-hours";
import { getHoursPaceStatus } from "@/lib/dashboard/hours-pace";

const TREND_LEGEND_KEYS = ["cumulativeHours", "idealCumulativeHours"] as const;

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
      initialDimension={CHART_INITIAL_DIMENSION}
      className={chartContainerClass(CHART_HEIGHT_COMPACT, className)}
    >
      <AreaChart data={[...points]} margin={CHART_MARGIN}>
        <defs>
          <linearGradient id="hoursActualFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-cumulativeHours)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-cumulativeHours)" stopOpacity={0.04} />
          </linearGradient>
        </defs>
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
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={28}
          tick={{ fontSize: 10 }}
          tickFormatter={(value) => `${value}h`}
        />
        <ChartTooltip
          cursor={CHART_TOOLTIP_CURSOR}
          content={
            <ConfigChartTooltip
              config={hoursTrendChartConfig}
              formatValue={(value) => formatHours(value)}
            />
          }
        />
        <ChartLegend
          content={
            <ConfigChartLegend config={hoursTrendChartConfig} keys={TREND_LEGEND_KEYS} />
          }
        />
        <Area
          type="monotone"
          dataKey="cumulativeHours"
          name="cumulativeHours"
          stroke="var(--color-cumulativeHours)"
          fill="url(#hoursActualFill)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--color-cumulativeHours)", strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--background))" }}
          animationDuration={700}
        />
        <Line
          type="monotone"
          dataKey="idealCumulativeHours"
          name="idealCumulativeHours"
          stroke="var(--color-idealCumulativeHours)"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          dot={false}
          animationDuration={600}
        />
        {last ? (
          <ReferenceDot
            x={last.label}
            y={last.cumulativeHours}
            r={5}
            fill={behind ? "var(--color-cumulativeHours)" : "var(--chart-4)"}
            stroke="hsl(var(--background))"
            strokeWidth={2}
          />
        ) : null}
      </AreaChart>
    </ChartContainer>
  );
}
