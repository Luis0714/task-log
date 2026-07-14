"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Rectangle,
  XAxis,
  YAxis,
} from "recharts";
import type { BarShapeProps } from "recharts";

import { ConfigChartLegend } from "@/components/dashboard/charts/config-chart-legend";
import { ConfigChartTooltip } from "@/components/dashboard/charts/config-chart-tooltip";
import { makeSprintDayAxisTick } from "@/components/dashboard/charts/sprint-day-axis-tick";
import { ChartContainer, ChartLegend, ChartTooltip } from "@/components/ui/chart";
import type { SprintDayHoursPoint } from "@/lib/dashboard/sprint-hours-series";
import {
  sprintDayAxisProps,
  sprintDayChartMargin,
} from "@/lib/dashboard/sprint-hours-series";
import {
  CHART_EMPTY_SEGMENT_COLOR,
  CHART_INITIAL_DIMENSION,
  CHART_TOOLTIP_CURSOR,
  CHART_HEIGHT_DAILY,
  chartContainerClass,
  hoursDailyChartConfig,
} from "@/lib/dashboard/chart-config";
import { formatHours } from "@/lib/dashboard/format-hours";

const DAILY_LEGEND_KEYS = ["taskHours", "bugHours"] as const;

const EMPTY_SEGMENT_OPACITY = 0.28;
const DIM_BAR_OPACITY = 0.55;
const TASK_BAR_OPACITY = 0.85;
const BUG_BAR_OPACITY = 0.9;

type StackedDayBarConfig = {
  colorVar: string;
  baseOpacity: number;
  isEmpty: (point: SprintDayHoursPoint) => boolean;
};

function resolveBarFillOpacity(
  empty: boolean,
  selected: boolean,
  dim: boolean,
  baseOpacity: number,
): number {
  if (empty) return EMPTY_SEGMENT_OPACITY;
  if (selected) return 1;
  if (dim) return DIM_BAR_OPACITY;
  return baseOpacity;
}

function resolveBarStroke(selected: boolean, empty: boolean, colorVar: string): string {
  if (selected && !empty) return colorVar;
  return "transparent";
}

function makeStackedDayBarShape(
  selectedDayKey: string | undefined,
  maxWorkableTotal: number,
  config: StackedDayBarConfig,
) {
  return function StackedDayBarShape(props: BarShapeProps) {
    const point = (props as { payload?: SprintDayHoursPoint }).payload;
    if (!point) return <Rectangle {...props} />;
    const selected = point.dayKey === selectedDayKey;
    const dim = point.totalHours < maxWorkableTotal * 0.25 && !selected;
    const empty = config.isEmpty(point);
    return (
      <Rectangle
        {...props}
        fill={empty ? CHART_EMPTY_SEGMENT_COLOR : config.colorVar}
        fillOpacity={resolveBarFillOpacity(empty, selected, dim, config.baseOpacity)}
        stroke={resolveBarStroke(selected, empty, config.colorVar)}
        strokeWidth={selected ? 2 : 0}
      />
    );
  };
}

export type StackedBarChartProps = Readonly<{
  points: readonly SprintDayHoursPoint[];
  selectedDayKey?: string;
  className?: string;
}>;

export function StackedBarChart({
  points,
  selectedDayKey,
  className,
}: StackedBarChartProps) {
  if (points.length === 0) return null;

  const maxWorkableTotal = Math.max(
    ...points.filter((p) => !p.isHoliday).map((p) => p.totalHours),
    1,
  );
  const dayCount = points.length;
  const dense = dayCount > 6;
  const { tick: axisTick, angle, textAnchor, ...axisRest } =
    sprintDayAxisProps(dayCount);
  const margin = sprintDayChartMargin(dayCount);
  const yAxisDomain: [number, number] = [0, maxWorkableTotal];

  const taskBarShape = makeStackedDayBarShape(selectedDayKey, maxWorkableTotal, {
    colorVar: "var(--color-taskHours)",
    baseOpacity: TASK_BAR_OPACITY,
    isEmpty: (point) => point.totalHours <= 0,
  });
  const bugBarShape = makeStackedDayBarShape(selectedDayKey, maxWorkableTotal, {
    colorVar: "var(--color-bugHours)",
    baseOpacity: BUG_BAR_OPACITY,
    isEmpty: (point) => point.bugHours <= 0,
  });

  return (
    <ChartContainer
      config={hoursDailyChartConfig}
      initialDimension={CHART_INITIAL_DIMENSION}
      className={chartContainerClass(CHART_HEIGHT_DAILY, className)}
    >
      <BarChart
        data={[...points]}
        margin={margin}
        barCategoryGap={dense ? "12%" : "20%"}
        barGap={2}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={dense ? 4 : 6}
          {...axisRest}
          tick={makeSprintDayAxisTick(points, {
            angle,
            textAnchor,
            fontSize: axisTick.fontSize,
          })}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          domain={yAxisDomain}
          width={28}
          tick={{ fontSize: 10 }}
          tickFormatter={(v) => `${v}h`}
        />
        <ChartTooltip
          cursor={CHART_TOOLTIP_CURSOR}
          content={
            <ConfigChartTooltip
              config={hoursDailyChartConfig}
              formatValue={(value) => formatHours(value)}
            />
          }
        />
        <ChartLegend
          content={
            <ConfigChartLegend config={hoursDailyChartConfig} keys={DAILY_LEGEND_KEYS} />
          }
        />
        <Bar
          dataKey="taskHours"
          name="taskHours"
          stackId="hours"
          fill="var(--color-taskHours)"
          maxBarSize={dense ? 20 : 32}
          minPointSize={3}
          animationDuration={650}
          shape={taskBarShape}
        />
        <Bar
          dataKey="bugHours"
          name="bugHours"
          stackId="hours"
          fill="var(--color-bugHours)"
          radius={[5, 5, 0, 0]}
          maxBarSize={dense ? 20 : 32}
          minPointSize={0}
          animationDuration={750}
          shape={bugBarShape}
        />
      </BarChart>
    </ChartContainer>
  );
}