import type { AssignmentSegment } from "@/lib/expected-hours";
import { computeExpectedHours } from "@/lib/expected-hours";
import { computeHoursByDay, type WorkedHoursItem } from "@/lib/hours/aggregate-hours";
import {
  EMPTY_HOURS_BREAKDOWN,
  totalHoursBreakdown,
} from "@/lib/hours/hours-breakdown";
import {
  formatSprintDayChartLabel,
  type SprintWorkingDay,
} from "@/lib/dashboard/sprint-days";
import {
  HOURS_PER_WORKING_DAY,
  isWorkingDayKey,
  type WorkingDayFilterOptions,
} from "@/lib/working-days";

export type SprintDayHoursPoint = {
  dayKey: string;
  /** Etiqueta del eje X (fecha normal). Los festivos usan la misma fecha que
   *  los demás días; se distinguen por estilo vía `isHoliday`, no por texto. */
  label: string;
  taskHours: number;
  bugHours: number;
  totalHours: number;
  cumulativeHours: number;
  /** Línea ideal acumulada respetando el % de asignación del usuario. */
  idealCumulativeHours: number;
  /** true cuando el día cae en festivo entre semana. La curva/ideal NO avanzan. */
  isHoliday: boolean;
};

export function sprintDayAxisProps(dayCount: number) {
  const dense = dayCount > 4;
  return {
    interval: 0 as const,
    angle: dense ? -48 : -18,
    textAnchor: "end" as const,
    height: dense ? 72 : 56,
    tick: { fontSize: dense ? 8 : 9 },
  };
}

export function sprintDayChartMargin(dayCount: number) {
  return {
    top: 12,
    right: 8,
    left: -18,
    bottom: dayCount > 4 ? 20 : 12,
  } as const;
}

/**
 * Serie de horas por día del sprint. Acepta el calendario completo (laborables
 * + festivos entre semana; los fines de semana NO entran) y emite un punto
 * por cada día: los festivos se renderizan en el eje X con su fecha normal
 * (se distinguen por estilo, no por texto) y NO modifican el cálculo (curva y
 * línea ideal se mantienen planas a lo largo del festivo).
 */
export function computeSprintHoursSeries(
  calendarDays: readonly SprintWorkingDay[],
  tasks: readonly WorkedHoursItem[],
  bugs: readonly WorkedHoursItem[],
  segments: readonly AssignmentSegment[] = [],
  options: WorkingDayFilterOptions = {},
): SprintDayHoursPoint[] {
  if (calendarDays.length === 0) return [];

  // Solo los laborables suman al cálculo de horas esperadas; los festivos
  // tampoco entran al denominador del `weightedPct`.
  const workingDayKeys = calendarDays
    .filter((day) => isWorkingDayKey(day.value, options))
    .map((day) => day.value);
  const { weightedPct } = computeExpectedHours(workingDayKeys, segments);
  const idealPerDay = (weightedPct / 100) * HOURS_PER_WORKING_DAY;

  const byDay = computeHoursByDay({
    tasks,
    bugs,
    workingDayKeys: new Set(workingDayKeys),
  });

  let runningTotal = 0;
  let idealRunning = 0;
  let workingDayIndex = 0;
  return calendarDays.map((day) => {
    if (isWorkingDayKey(day.value, options)) {
      const breakdown = byDay.get(day.value) ?? EMPTY_HOURS_BREAKDOWN;
      const total = totalHoursBreakdown(breakdown);
      runningTotal += total;
      workingDayIndex += 1;
      idealRunning = workingDayIndex * idealPerDay;

      return {
        dayKey: day.value,
        label: formatSprintDayChartLabel(day),
        taskHours: breakdown.taskHours,
        bugHours: breakdown.bugHours,
        totalHours: total,
        cumulativeHours: Math.round(runningTotal * 10) / 10,
        idealCumulativeHours: Math.round(idealRunning * 10) / 10,
        isHoliday: false,
      };
    }

    return {
      dayKey: day.value,
      label: formatSprintDayChartLabel(day),
      taskHours: 0,
      bugHours: 0,
      totalHours: 0,
      cumulativeHours: Math.round(runningTotal * 10) / 10,
      idealCumulativeHours: Math.round(idealRunning * 10) / 10,
      isHoliday: true,
    };
  });
}