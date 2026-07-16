import {
  EMPTY_HOURS_BREAKDOWN,
  totalHoursBreakdown,
} from "@/lib/hours/hours-breakdown";
import { roundHours } from "@/lib/number/rounding";
import { computeCompliance } from "@/lib/reports/hours/compliance";
import type {
  SprintTimesMetrics,
  SprintTimesPersonRow,
  SprintTimesWeekColumn,
} from "@/lib/sprints/sprint-stats-types";

export const SPRINT_TIMES_WEEK_ALL = "all";

/** `"all"` = sprint completo; un número = índice de semana (base 0). */
export type SprintTimesWeekSelection = typeof SPRINT_TIMES_WEEK_ALL | number;

export function parseSprintTimesWeekSelection(
  value: string,
  weekCount: number,
): SprintTimesWeekSelection {
  const index = Number.parseInt(value, 10);
  if (!Number.isInteger(index) || index < 0 || index >= weekCount) {
    return SPRINT_TIMES_WEEK_ALL;
  }
  return index;
}

/**
 * Horas esperadas de una semana. Con snapshots antiguos (sin
 * `expectedHoursByWeek`) se prorratea el total del sprint por días hábiles,
 * igual que el share de tiempos.
 */
export function resolveWeekExpectedHours(
  row: SprintTimesPersonRow,
  weekIndex: number,
  weeks: readonly SprintTimesWeekColumn[],
): number {
  const exact = row.expectedHoursByWeek[weekIndex];
  if (exact !== undefined) return exact;

  const totalWorkingDays = weeks.reduce(
    (acc, week) => acc + week.workingDaysCount,
    0,
  );
  if (totalWorkingDays <= 0) return 0;
  const weekWorkingDays = weeks[weekIndex]?.workingDaysCount ?? 0;
  return roundHours(row.expectedHours * (weekWorkingDays / totalWorkingDays));
}

function filterRowByWeek(
  row: SprintTimesPersonRow,
  weekIndex: number,
  weeks: readonly SprintTimesWeekColumn[],
): SprintTimesPersonRow {
  const weekBreakdown = row.weeks[weekIndex] ?? EMPTY_HOURS_BREAKDOWN;
  const expectedHours = resolveWeekExpectedHours(row, weekIndex, weeks);
  const { pct, level } = computeCompliance(
    totalHoursBreakdown(weekBreakdown),
    expectedHours,
  );

  return {
    ...row,
    weeks: [weekBreakdown],
    sprint: weekBreakdown,
    expectedHours,
    expectedHoursByWeek: [expectedHours],
    compliancePct: pct,
    semaforo: level,
  };
}

/**
 * Restringe las métricas a la semana seleccionada, recalculando horas
 * esperadas y % cumplimiento para ese tramo (la asignación vigente puede
 * variar entre semanas).
 */
export function filterSprintTimesByWeek(
  times: SprintTimesMetrics,
  selection: SprintTimesWeekSelection,
): SprintTimesMetrics {
  if (selection === SPRINT_TIMES_WEEK_ALL) return times;

  const week = times.weeks[selection];
  if (!week) return times;

  return {
    weeks: [week],
    rows: times.rows.map((row) => filterRowByWeek(row, selection, times.weeks)),
  };
}
