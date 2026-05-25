"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";

import { ConfigChartTooltip } from "@/components/dashboard/charts/config-chart-tooltip";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import type { PbiStateBar } from "@/lib/dashboard/pbi-state-chart-data";
import {
  CHART_TOOLTIP_CURSOR,
  chartContainerClass,
  pbiStateChartConfig,
} from "@/lib/dashboard/chart-config";
import { getPbiStateChartColor } from "@/lib/work-items/pbi-state-colors";

const MARGIN = { top: 12, right: 28, left: 2, bottom: 0 } as const;

export type HorizontalBarChartProps = {
  bars: readonly PbiStateBar[];
  className?: string;
};

export function HorizontalBarChart({ bars, className }: HorizontalBarChartProps) {
  if (bars.length === 0) return null;

  const maxCount = Math.max(...bars.map((b) => b.count), 1);
  const chartHeight = Math.min(220, Math.max(150, bars.length * 28 + 24));

  return (
    <ChartContainer
      config={pbiStateChartConfig}
      className={chartContainerClass(undefined, className)}
      style={{ height: chartHeight }}
    >
      <BarChart data={[...bars]} layout="vertical" margin={MARGIN} barCategoryGap="14%">
        <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/40" />
        <XAxis type="number" hide domain={[0, maxCount]} />
        <YAxis
          type="category"
          dataKey="state"
          tickLine={false}
          axisLine={false}
          width={88}
          tick={{ fontSize: 11 }}
        />
        <ChartTooltip
          cursor={CHART_TOOLTIP_CURSOR}
          content={
            <ConfigChartTooltip
              config={pbiStateChartConfig}
              formatValue={(value) => `${value} PBI${value === 1 ? "" : "s"}`}
            />
          }
        />
        <Bar dataKey="count" name="count" maxBarSize={14} radius={[0, 5, 5, 0]} animationDuration={700}>
          {bars.map((bar) => {
            const isLead = bar.count === maxCount && maxCount > 0;
            const fill = getPbiStateChartColor(bar.state);
            return (
              <Cell
                key={bar.state}
                fill={fill}
                fillOpacity={isLead ? 1 : 0.88}
                stroke={isLead ? fill : "transparent"}
                strokeWidth={isLead ? 1.5 : 0}
              />
            );
          })}
          <LabelList
            dataKey="count"
            position="right"
            className="fill-foreground text-[10px] font-semibold"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
