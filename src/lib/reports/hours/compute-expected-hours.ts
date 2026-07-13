import { roundToDecimals, roundHours } from "@/lib/number/rounding";
import { HOURS_PER_WORKING_DAY } from "@/lib/working-days";

/**
 * Tramo de asignación vigente en un intervalo de fechas. Un porcentaje del
 * 100% por defecto se modela como un único tramo `{ pct: 100 }` que cubre
 * todo el periodo, de modo que el cálculo por defecto y por excepción usan
 * el mismo camino.
 */
export type AssignmentSegment = Readonly<{
  /** Porcentaje entero 1..100 vigente en el tramo. */
  pct: number;
  /** Inicio de vigencia (YYYY-MM-DD, inclusive). */
  from: string;
  /** Fin de vigencia (YYYY-MM-DD, inclusive) o `null` = vigencia abierta. */
  to: string | null;
}>;

export type ExpectedHoursResult = Readonly<{
  /** Días hábiles del periodo con asignación aplicable. */
  workingDays: number;
  /** Horas esperadas: Σ (día hábil × 8 × %/100). */
  expectedHours: number;
  /** % ponderado sobre la capacidad total del periodo (0 si no hay días). */
  weightedPct: number;
}>;

function pctForDate(
  date: string,
  segments: readonly AssignmentSegment[],
): number {
  for (const segment of segments) {
    const startsOnOrBefore = segment.from <= date;
    const endsOnOrAfter = segment.to === null || date <= segment.to;
    if (startsOnOrBefore && endsOnOrAfter) return segment.pct;
  }
  return 0;
}

/**
 * Horas esperadas del periodo, calculadas **por día hábil** para soportar
 * cambios de asignación dentro del periodo (cálculo por tramos, CA-16).
 *
 * @param workingDayDates Fechas hábiles del periodo (YYYY-MM-DD).
 * @param segments Tramos de asignación vigentes que se cruzan con el periodo.
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
