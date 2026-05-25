"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { PbiStateBar } from "@/lib/dashboard/pbi-state-chart-data";
import { pbiStateChartConfig } from "@/lib/dashboard/chart-config";
import {
  ChartGradientDefs,
  gradientFill,
  workflowBarGradient,
} from "@/lib/dashboard/chart-gradients";
import { cn } from "@/lib/utils";

const MARGIN = { top: 2, right: 28, left: 2, bottom: 2 };

export type HorizontalBarChartProps = {
  bars: readonly PbiStateBar[];
  className?: string;
};

export function HorizontalBarChart({ bars, className }: HorizontalBarChartProps) {
  const gradients = useMemo(
    () => bars.map((_, index) => workflowBarGradient(index, bars.length)),
    [bars],
  );

  if (bars.length === 0) return null;

  const maxCount = Math.max(...bars.map((b) => b.count), 1);
  const chartHeight = Math.min(220, Math.max(120, bars.length * 28 + 16));

  return (
    <ChartContainer
      config={pbiStateChartConfig}
      className={cn("w-full", className)}
      style={{ height: chartHeight }}
    >
      <BarChart data={[...bars]} layout="vertical" margin={MARGIN} barCategoryGap="14%">
        <ChartGradientDefs gradients={gradients} />
        <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-border/40" />
        <XAxis type="number" hide domain={[0, maxCount]} />
        <YAxis
          type="category"
          dataKey="state"
          tickLine={false}
          axisLine={false}
          width={88}
          tick={{ fontSize: 10 }}
        />
        <ChartTooltip
          cursor={{ fill: "hsl(var(--primary))", opacity: 0.08 }}
          content={<ChartTooltipContent hideLabel indicator="dot" />}
        />
        <Bar dataKey="count" maxBarSize={14} radius={[0, 5, 5, 0]} animationDuration={700}>
          {bars.map((bar, index) => {
            const isLead = bar.count === maxCount && maxCount > 0;
            return (
              <Cell
                key={bar.state}
                fill={gradientFill(gradients[index].id)}
                fillOpacity={isLead ? 1 : 0.82}
                stroke={isLead ? "var(--chart-1)" : "transparent"}
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
