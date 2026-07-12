import type { AssignmentSegment } from "@/lib/reports/hours/compute-expected-hours";

export type AssignmentForSegment = {
  assignmentPct: number;
  validFrom: string;
  validTo: string | null;
};

export type ResolveAssignmentSegmentsArgs = {
  assignments: readonly AssignmentForSegment[];
  periodStart: string;
  periodEnd: string;
  hasInferredDefault: boolean;
};

/**
 * Resuelve los tramos de asignación aplicables al periodo.
 *
 * Reglas:
 * - Sin asignaciones y sin default inferido → sin tramos ("Sin configurar").
 * - Sin asignaciones pero con default inferido → 100% en la totalidad del
 *   periodo.
 * - Con asignaciones → se filtran las que se cruzan con el periodo; si
 *   ninguna se cruza, se usa el % de la más reciente cubriendo la totalidad
 *   del periodo (la asignación en BD rige, anula "Sin configurar" — decisión
 *   del usuario: "si la persona tiene asignación en BD, esa es la que
 *   rige").
 */
export function resolveAssignmentSegments(
  args: ResolveAssignmentSegmentsArgs,
): AssignmentSegment[] {
  const { assignments, periodStart, periodEnd, hasInferredDefault } = args;

  if (assignments.length === 0 && !hasInferredDefault) {
    return [];
  }

  if (assignments.length === 0) {
    return [{ pct: 100, from: periodStart, to: null }];
  }

  const segments: AssignmentSegment[] = [];

  for (const a of assignments) {
    if (a.validFrom > periodEnd) continue;
    if (a.validTo !== null && a.validTo < periodStart) continue;
    segments.push({
      pct: a.assignmentPct,
      from: a.validFrom,
      to: a.validTo,
    });
  }

  if (segments.length === 0) {
    // La persona tiene excepción en BD pero ningún tramo cae dentro del
    // periodo (vigencia futura o ya vencida). La asignación de BD gobierna:
    // aplicamos su % más reciente como tramo único cubriendo la totalidad
    // del periodo para que el reporte calcule y nunca quede "Sin
    // configurar".
    const mostRecent = [...assignments].sort((x, y) =>
      x.validFrom.localeCompare(y.validFrom),
    ).at(-1)!;
    return [{ pct: mostRecent.assignmentPct, from: periodStart, to: null }];
  }

  return segments.sort((x, y) => x.from.localeCompare(y.from));
}