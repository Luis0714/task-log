"use client";

import { Cell, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatHours } from "@/lib/dashboard/format-hours";
import type { HoursBreakdown } from "@/lib/dashboard/hours-breakdown";
import { totalHoursBreakdown } from "@/lib/dashboard/hours-breakdown";
import { CHART_HEIGHT_INLINE, hoursMixChartConfig } from "@/lib/dashboard/chart-config";
import { cn } from "@/lib/utils";

export type HoursMixChartProps = {
  breakdown: HoursBreakdown;
  className?: string;
};

export function HoursMixChart({ breakdown, className }: HoursMixChartProps) {
  const total = totalHoursBreakdown(breakdown);
  if (total <= 0) {
    return <p className="text-muted-foreground text-sm">Sin horas registradas en el sprint.</p>;
  }

  const slices = [
    { key: "taskHours", value: breakdown.taskHours },
    { key: "bugHours", value: breakdown.bugHours },
  ].filter((slice) => slice.value > 0);

  const taskPercent = Math.round((breakdown.taskHours / total) * 100);
  const bugHeavy = taskPercent < 60;

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <ChartContainer
        config={hoursMixChartConfig}
        className={cn(CHART_HEIGHT_INLINE, "w-[100px] shrink-0")}
      >
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="key" />} />
          <Pie
            data={slices}
            dataKey="value"
            nameKey="key"
            innerRadius={34}
            outerRadius={48}
            paddingAngle={4}
            cornerRadius={5}
            strokeWidth={2}
            stroke="hsl(var(--background))"
            animationDuration={700}
          >
            {slices.map((slice) => (
              <Cell key={slice.key} fill={`var(--color-${slice.key})`} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-heading text-lg font-semibold tabular-nums leading-none">
          <span className={bugHeavy ? "text-amber-600 dark:text-amber-400" : "text-primary"}>
            {taskPercent}%
          </span>
          <span className="text-muted-foreground ml-1 text-sm font-normal">tasks</span>
        </p>
        <p className="text-muted-foreground text-xs leading-snug">
          {formatHours(breakdown.taskHours)} dev · {formatHours(breakdown.bugHours)} bugs
        </p>
        <div className="flex gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="bg-chart-1 size-1.5 rounded-full" />
            Tasks
          </span>
          <span className="flex items-center gap-1">
            <span className="bg-chart-4 size-1.5 rounded-full" />
            Bugs
          </span>
        </div>
      </div>
    </div>
  );
}
