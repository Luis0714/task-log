"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import { DeliveryChartLegend } from "@/components/dashboard/charts/delivery-chart-legend";
import { DeliveryChartTooltip } from "@/components/dashboard/charts/delivery-chart-tooltip";
import {
  ChartContainer,
  ChartLegend,
  ChartTooltip,
} from "@/components/ui/chart";
import type { DeliveryChartRow } from "@/lib/dashboard/delivery-chart-data";
import {
  CHART_HEIGHT_DEFAULT,
  CHART_INITIAL_DIMENSION,
  CHART_MARGIN,
  CHART_TOOLTIP_CURSOR,
  chartContainerClass,
  deliveryChartConfig,
} from "@/lib/dashboard/chart-config";

const BAR_SERIES = [
  { key: "pending" as const },
  { key: "inProgress" as const },
  { key: "completed" as const },
] as const;

function seriesFill(key: (typeof BAR_SERIES)[number]["key"]): string {
  return `var(--color-${key})`;
}

export type GroupedBarChartProps = {
  rows: DeliveryChartRow[];
  className?: string;
};

export function GroupedBarChart({ rows, className }: GroupedBarChartProps) {
  if (rows.length === 0) return null;

  return (
    <ChartContainer
      config={deliveryChartConfig}
      initialDimension={{ ...CHART_INITIAL_DIMENSION, height: 180 }}
      className={chartContainerClass(CHART_HEIGHT_DEFAULT, className)}
    >
      <BarChart data={rows} margin={CHART_MARGIN} barCategoryGap="22%" barGap={6}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          tick={{ fontSize: 11 }}
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} tick={{ fontSize: 10 }} />
        <ChartTooltip cursor={CHART_TOOLTIP_CURSOR} content={<DeliveryChartTooltip />} />
        <ChartLegend content={<DeliveryChartLegend />} />
        {BAR_SERIES.map(({ key }) => (
          <Bar
            key={key}
            dataKey={key}
            name={key}
            fill={seriesFill(key)}
            stroke={seriesFill(key)}
            strokeWidth={0}
            radius={[5, 5, 0, 0]}
            maxBarSize={28}
            animationDuration={650}
            activeBar={{
              fill: seriesFill(key),
              stroke: seriesFill(key),
              strokeWidth: 1,
              opacity: 1,
            }}
          >
            {key === "completed" ? (
              <LabelList
                dataKey="completed"
                position="top"
                className="fill-foreground text-[10px] font-medium"
              />
            ) : null}
          </Bar>
        ))}
      </BarChart>
    </ChartContainer>
  );
}
