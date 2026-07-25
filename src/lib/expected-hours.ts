import { roundToDecimals, roundHours } from "@/lib/number/rounding";
import { HOURS_PER_WORKING_DAY } from "@/lib/working-days";

/**
 * Fallback del target del sprint cuando NO hay días hábiles resueltos
 * (sin sprint activo, sprint sin fechas, o error del calendario). Única
 * constante de la plataforma con este valor: cualquier caller que derive
 * horas esperadas desde el calendario debe pasar este fallback (o uno
 * propio) para mantener una sola fuente de verdad.
 */
export const DEFAULT_SPRINT_HOURS_TARGET = 40;

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

/**
 * Porcentaje de asignación vigente en un día concreto (típicamente el último
 * día laborable que muestra la card `Horas hoy`). Resuelve el tramo por
 * fecha con la MISMA regla que `computeExpectedHours` usa para el Reporte
 * por Período y el sprint (`pctForDate`): única fuente de verdad.
 *
 * Sin tramos → 100 (D17/D18: toda persona parte de 100% por defecto).
 */
export function resolveAssignmentPct(
  dayKey: string,
  segments: readonly AssignmentSegment[],
): number {
  if (segments.length === 0) return 100;
  return pctForDate(dayKey, segments);
}

/**
 * Horas esperadas de un día individual: 8 × %asignación(día)/100. Es el caso
 * de un solo día de la fórmula de `computeExpectedHours`.
 */
export function expectedHoursForDay(
  dayKey: string,
  segments: readonly AssignmentSegment[],
): number {
  return roundHours(
    HOURS_PER_WORKING_DAY * (resolveAssignmentPct(dayKey, segments) / 100),
  );
}

/**
 * Target del sprint derivado del calendario + tramos de asignación. Es el
 * ÚNICO punto donde la meta del sprint se calcula a partir del set de días
 * hábiles resuelto (que ya excluye fines de semana + festivos del central
 * service).
 *
 * - Si `sprintDayKeys` está vacío (sin sprint o sprint sin fechas) cae al
 *   `fallback` (default: [`DEFAULT_SPRINT_HOURS_TARGET`]).
 * - Si hay días, delega en `computeExpectedHours(sprintDayKeys, segments)`,
 *   que ya pondera cada día por su % de asignación vigente. Un festivo entre
 *   semana (caso del 2026-07-20) REDUCE el target en proporción a los
 *   días hábiles reales: sprint lun 20-jul → vie 24-jul con festivo = 4
 *   hábiles × 8h × % = 32h (al 100%), no 40h.
 *
 * Usado por el dashboard del sprint (`build-dashboard-metrics.ts`) y por
 * cualquier builder que necesite la meta del sprint: garantiza que un
 * festivo entre semana reduce el target en proporción a los días hábiles
 * reales.
 */
export function resolveSprintHoursTarget(
  sprintDayKeys: readonly string[],
  segments: readonly AssignmentSegment[],
  fallback: number = DEFAULT_SPRINT_HOURS_TARGET,
): number {
  if (sprintDayKeys.length === 0) return fallback;
  return computeExpectedHours(sprintDayKeys, segments).expectedHours;
}