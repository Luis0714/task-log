"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { DeliveryChartRow } from "@/lib/dashboard/delivery-chart-data";
import {
  CHART_HEIGHT_DEFAULT,
  deliveryChartConfig,
} from "@/lib/dashboard/chart-config";
import {
  ChartGradientDefs,
  DELIVERY_GRADIENTS,
  gradientFill,
} from "@/lib/dashboard/chart-gradients";
import { cn } from "@/lib/utils";

const MARGIN = { top: 12, right: 8, left: -18, bottom: 0 };

const BAR_SERIES = [
  { key: "pending" as const, gradientId: "grad-pending" },
  { key: "inProgress" as const, gradientId: "grad-inProgress" },
  { key: "completed" as const, gradientId: "grad-completed" },
];

export type GroupedBarChartProps = {
  rows: DeliveryChartRow[];
  className?: string;
};

export function GroupedBarChart({ rows, className }: GroupedBarChartProps) {
  if (rows.length === 0) return null;

  return (
    <ChartContainer
      config={deliveryChartConfig}
      className={cn(CHART_HEIGHT_DEFAULT, "w-full", className)}
    >
      <BarChart data={rows} margin={MARGIN} barCategoryGap="22%" barGap={6}>
        <ChartGradientDefs gradients={DELIVERY_GRADIENTS} />
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={6}
          tick={{ fontSize: 11 }}
        />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} tick={{ fontSize: 10 }} />
        <ChartTooltip
          cursor={{ fill: "hsl(var(--primary))", opacity: 0.08 }}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        {BAR_SERIES.map(({ key, gradientId }) => (
          <Bar
            key={key}
            dataKey={key}
            fill={gradientFill(gradientId)}
            radius={[5, 5, 0, 0]}
            maxBarSize={28}
            animationDuration={650}
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
