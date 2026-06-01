"use client";

import { Cell, Pie, PieChart } from "recharts";

import { ChartContainer } from "@/components/ui/chart";
import {
  PROGRESS_RING_CHART_SIZE_CLASS,
  PROGRESS_RING_PIE,
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
      initialDimension={{ width: 96, height: 96 }}
      className={chartContainerClass(
        undefined,
        cn(PROGRESS_RING_CHART_SIZE_CLASS, "aspect-square min-h-0 min-w-0", className),
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
          {...PROGRESS_RING_PIE}
        >
          {slices.map((slice) => (
            <Cell key={slice.key} fill={`var(--color-${slice.key})`} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
