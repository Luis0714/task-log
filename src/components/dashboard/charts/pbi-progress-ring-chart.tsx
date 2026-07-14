"use client";

import { Pie, PieChart } from "recharts";

import { ChartContainer } from "@/components/ui/chart";
import {
  PROGRESS_RING_CHART_SIZE_CLASS,
  PROGRESS_RING_PIE,
  chartContainerClass,
  pbiProgressChartConfig,
} from "@/lib/dashboard/chart-config";
import { cn } from "@/lib/utils";

export type PbiProgressRingChartProps = Readonly<{
  percent: number;
  className?: string;
}>;

function buildRingSlices(
  percent: number,
): { key: "completed" | "remaining"; value: number; fill: string }[] {
  const clamped = Math.min(100, Math.max(0, percent));
  if (clamped <= 0)
    return [{ key: "remaining", value: 100, fill: "var(--color-remaining)" }];
  if (clamped >= 100)
    return [{ key: "completed", value: 100, fill: "var(--color-completed)" }];
  return [
    { key: "completed", value: clamped, fill: "var(--color-completed)" },
    { key: "remaining", value: 100 - clamped, fill: "var(--color-remaining)" },
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
        />
      </PieChart>
    </ChartContainer>
  );
}
