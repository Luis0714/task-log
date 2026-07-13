import { roundToDecimals, roundHours } from "@/lib/number/rounding";
import { HOURS_PER_WORKING_DAY } from "@/lib/working-days";

export type AssignmentSegment = Readonly<{
  /** Porcentaje entero 1..100 vigente en el tramo. */
  pct: number;
  /** Inicio de vigencia (YYYY-MM-DD, inclusive). */
  from: string;
  /** Fin de vigencia (YYYY-MM-DD, inclusive) o `null` = vigencia abierta. */
  to: string | null;
}>;

export type ExpectedHoursResult = Readonly<{
  workingDays: number;
  /** Σ (día hábil × 8 × %/100). */
  expectedHours: number;
  /** % ponderado sobre la capacidad total del periodo (0 si no hay días). */
  weightedPct: number;
}>;

function pctForDate(date: string, segments: readonly AssignmentSegment[]): number {
  for (const segment of segments) {
    const startsOnOrBefore = segment.from <= date;
    const endsOnOrAfter = segment.to === null || date <= segment.to;
    if (startsOnOrBefore && endsOnOrAfter) return segment.pct;
  }
  return 0;
}

/**
 * Horas esperadas sobre días hábiles, respetando tramos de asignación
 * (CA-16). Reutilizada por el reporte de horas por periodo, el dashboard
 * del sprint y las métricas semanales: misma fórmula para todos.
 */
export function computeExpectedHours(
  workingDayDates: readonly string[],
  segments: readonly AssignmentSegment[],
): ExpectedHoursResult {
  const workingDays = workingDayDates.length;
  if (workingDays === 0) {
    return { workingDays: 0, expectedHours: 0, weightedPct: 0 };
  }

  let expectedHours = 0;
  for (const date of workingDayDates) {
    expectedHours += HOURS_PER_WORKING_DAY * (pctForDate(date, segments) / 100);
  }

  const capacity = workingDays * HOURS_PER_WORKING_DAY;
  return {
    workingDays,
    expectedHours: roundHours(expectedHours),
    weightedPct: roundToDecimals((expectedHours / capacity) * 100, 1),
  };
}