import type { AssignmentSegment } from "@/lib/expected-hours";

export type AssignmentForSegment = {
  assignmentPct: number;
  validFrom: string;
  validTo: string | null;
};

export type AssignmentDateRow = {
  assignmentPct: number;
  validFrom: Date | string;
  validTo: Date | string | null;
};

/** Normaliza filas de BD (fechas `Date` o ISO) al input de segmentos. */
export function toAssignmentsForSegments(
  rows: readonly AssignmentDateRow[],
): AssignmentForSegment[] {
  return rows.map((row) => ({
    assignmentPct: row.assignmentPct,
    validFrom: toIsoDateKey(row.validFrom),
    validTo: row.validTo === null ? null : toIsoDateKey(row.validTo),
  }));
}

function toIsoDateKey(date: Date | string): string {
  if (typeof date === "string") return date.slice(0, 10);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

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
 * - Los tramos que sí se cruzan deben cubrir la totalidad del periodo por la
 *   misma regla: el primero se extiende hasta el inicio del periodo, los
 *   huecos entre tramos los cubre el tramo anterior (el % vigente más
 *   reciente) y el último queda abierto. Sin esto, los días hábiles fuera de
 *   la vigencia contaban 0% y las horas esperadas quedaban recortadas (p. ej.
 *   50% registrado un viernes ⇒ 4 h esperadas en la semana en vez de 20 h).
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

  const intersecting = intersectingSegments(assignments, periodStart, periodEnd);

  if (intersecting.length === 0) {
    const mostRecent = [...assignments].sort((x, y) =>
      x.validFrom.localeCompare(y.validFrom),
    ).at(-1)!;
    return [{ pct: mostRecent.assignmentPct, from: periodStart, to: null }];
  }

  return coverFullPeriod(intersecting, periodStart, periodEnd);
}

/** Tramos cuya vigencia se cruza con el periodo, ordenados por inicio. */
function intersectingSegments(
  assignments: readonly AssignmentForSegment[],
  periodStart: string,
  periodEnd: string,
): AssignmentSegment[] {
  const segments: AssignmentSegment[] = [];
  for (const a of assignments) {
    if (a.validFrom > periodEnd) continue;
    if (a.validTo !== null && a.validTo < periodStart) continue;
    segments.push({ pct: a.assignmentPct, from: a.validFrom, to: a.validTo });
  }
  return segments.sort((x, y) => x.from.localeCompare(y.from));
}

/**
 * Extiende los tramos para que cubran la totalidad del periodo: el primero
 * arranca en el inicio del periodo, los huecos los cubre el tramo anterior y
 * el último queda abierto.
 */
function coverFullPeriod(
  sorted: readonly AssignmentSegment[],
  periodStart: string,
  periodEnd: string,
): AssignmentSegment[] {
  const covered: AssignmentSegment[] = [];
  for (const segment of sorted) {
    const prev = covered.at(-1);
    if (!prev) {
      covered.push(
        segment.from > periodStart
          ? { ...segment, from: periodStart }
          : segment,
      );
      continue;
    }
    if (prev.to !== null && addDaysToIsoDate(prev.to, 1) < segment.from) {
      covered[covered.length - 1] = {
        ...prev,
        to: addDaysToIsoDate(segment.from, -1),
      };
    }
    covered.push(segment);
  }

  const last = covered.at(-1);
  if (last && last.to !== null && last.to < periodEnd) {
    covered[covered.length - 1] = { ...last, to: null };
  }
  return covered;
}

function addDaysToIsoDate(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}