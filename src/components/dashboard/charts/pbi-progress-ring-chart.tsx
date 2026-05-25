"use client";

import { Cell, Pie, PieChart } from "recharts";

import { ChartContainer } from "@/components/ui/chart";
import { chartContainerClass, pbiProgressChartConfig } from "@/lib/dashboard/chart-config";
import { cn } from "@/lib/utils";

const RING_SIZE = { compact: 96, default: 112 } as const;

const RING_RADII = {
  compact: { inner: 36, outer: 44 },
  default: { inner: 44, outer: 52 },
} as const;

export type PbiProgressRingChartProps = {
  percent: number;
  compact?: boolean;
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

export function PbiProgressRingChart({
  percent,
  compact = false,
  className,
}: PbiProgressRingChartProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const size = compact ? RING_SIZE.compact : RING_SIZE.default;
  const radii = compact ? RING_RADII.compact : RING_RADII.default;
  const slices = buildRingSlices(clamped);

  return (
    <ChartContainer
      config={pbiProgressChartConfig}
      initialDimension={{ width: size, height: size }}
      className={chartContainerClass(undefined, cn("shrink-0", className))}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Progreso del sprint: ${clamped} por ciento`}
    >
      <PieChart>
        <Pie
          data={slices}
          dataKey="value"
          nameKey="key"
          innerRadius={radii.inner}
          outerRadius={radii.outer}
          startAngle={90}
          endAngle={-270}
          strokeWidth={0}
          isAnimationActive
          animationDuration={500}
        >
          {slices.map((slice) => (
            <Cell key={slice.key} fill={`var(--color-${slice.key})`} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}
