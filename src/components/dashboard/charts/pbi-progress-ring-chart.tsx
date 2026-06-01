"use client";

import { Cell, Pie, PieChart } from "recharts";

import { ChartContainer } from "@/components/ui/chart";
import {
  CHART_HEIGHT_INLINE,
  CHART_WIDTH_INLINE_RING,
  INLINE_PIE_RING,
  PROGRESS_RING_CHART_RESPONSIVE_CLASS,
  chartContainerClass,
  pbiProgressChartConfig,
} from "@/lib/dashboard/chart-config";
import { cn } from "@/lib/utils";

export type PbiProgressRingChartProps = {
  percent: number;
  className?: string;
};

function buildRingSlices(percent: number): { key: "completed" | "remaining"; value: number }[] {
  const clamped = Math.min(100, Math.max(0, percent));
  if (clamped <= 0) return [{ key: "remaining", value: 100 }];
  if (clamped >= 100) return [{ key: "completed", value: 100 }];
  return [
    { key: "completed", value: clamped },
    { key: "remaining", value: 100 - clamped },
  ];
}

export function PbiProgressRingChart({ percent, className }: PbiProgressRingChartProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const slices = buildRingSlices(clamped);

  return (
    <ChartContainer
      config={pbiProgressChartConfig}
      className={chartContainerClass(
        CHART_HEIGHT_INLINE,
        cn(
          CHART_WIDTH_INLINE_RING,
          PROGRESS_RING_CHART_RESPONSIVE_CLASS,
          "shrink-0",
          className,
        ),
      )}
      role="img"
      aria-label={`Progreso del sprint: ${clamped} por ciento`}
    >
      <PieChart>
        <Pie
          data={slices}
          dataKey="value"
          nameKey="key"
          startAngle={90}
          endAngle={-270}
          isAnimationActive
          {...INLINE_PIE_RING}
        >
          {slices.map((slice) => (
            <Cell key={slice.key} fill={`var(--color-${slice.key})`} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
