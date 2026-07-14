"use client";

import { Text } from "recharts";

import { CHART_HOLIDAY_LABEL_COLOR } from "@/lib/dashboard/chart-config";
import type { SprintDayHoursPoint } from "@/lib/dashboard/sprint-hours-series";

type TextAnchor = "start" | "middle" | "end" | "inherit";

type AxisTickGeometry = {
  x?: number | string;
  y?: number | string;
  payload?: { value?: string | number; index?: number };
  index?: number;
};

/**
 * Tick del eje X compartido por las gráficas de ritmo y horas por día. Los
 * festivos conservan su fecha normal pero se resaltan en negrita y con color
 * distinto (única forma de distinguirlos: sin la palabra "Festivo").
 */
export function makeSprintDayAxisTick(
  points: readonly SprintDayHoursPoint[],
  axis: { angle: number; fontSize: number; textAnchor: TextAnchor },
) {
  return function SprintDayAxisTick(geometry: AxisTickGeometry) {
    const index = geometry.payload?.index ?? geometry.index ?? -1;
    const holiday = Boolean(points[index]?.isHoliday);
    return (
      <Text
        x={geometry.x}
        y={geometry.y}
        textAnchor={axis.textAnchor}
        verticalAnchor="start"
        angle={axis.angle}
        fontSize={axis.fontSize}
        fontWeight={holiday ? 700 : undefined}
        className={holiday ? undefined : "fill-muted-foreground"}
        fill={holiday ? CHART_HOLIDAY_LABEL_COLOR : undefined}
      >
        {String(geometry.payload?.value ?? "")}
      </Text>
    );
  };
}
