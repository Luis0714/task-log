import { totalHoursBreakdown } from "@/lib/hours/hours-breakdown";
import { SPRINT_BUG_UNASSIGNED_LABEL } from "@/lib/sprints/filter-sprint-bug-detail-items";
import type { SprintTimesPersonRow } from "@/lib/sprints/sprint-stats-types";

/**
 * Compara dos filas por porcentaje de cumplimiento en orden descendente.
 * Las filas con cumplimiento `null` (sin esperadas o sin horas reportadas) se
 * empujan al final. Devuelve un número con la convención de `Array#sort`.
 */
export function compareSprintTimesPersonRowsByCompliance(
  left: Pick<SprintTimesPersonRow, "compliancePct">,
  right: Pick<SprintTimesPersonRow, "compliancePct">,
): number {
  if (left.compliancePct === null && right.compliancePct === null) return 0;
  if (left.compliancePct === null) return 1;
  if (right.compliancePct === null) return -1;
  return right.compliancePct - left.compliancePct;
}

/**
 * Criterio único de orden para las filas del Reporte de Horas por Sprint.
 * Lo comparten la tabla, la imagen para compartir y el reporte exportado
 * (Excel single y combinado multi-sprint).
 *
 * Reglas, en orden de prioridad:
 *   1. % de cumplimiento descendente (nulos al final).
 *   2. Total de horas del sprint descendente como desempate.
 *   3. Fila sintética "Sin asignar" al final.
 *   4. Alfabético por nombre de la persona (`locale es`).
 *
 * Devuelve un nuevo arreglo; nunca muta el original.
 */
export function sortSprintTimesPersonRows<T extends SprintTimesPersonRow>(
  rows: readonly T[],
): T[] {
  return [...rows].sort(compareSprintTimesPersonRowsFull);
}

/**
 * Comparador completo para usar en `Array#sort` o en una pipeline que
 * necesite la misma regla pieza por pieza. Ver `sortSprintTimesPersonRows`.
 */
export function compareSprintTimesPersonRowsFull(
  left: SprintTimesPersonRow,
  right: SprintTimesPersonRow,
): number {
  const complianceDiff = compareSprintTimesPersonRowsByCompliance(left, right);
  if (complianceDiff !== 0) return complianceDiff;

  const totalDiff = totalHoursBreakdown(right.sprint) - totalHoursBreakdown(left.sprint);
  if (totalDiff !== 0) return totalDiff;

  if (left.assignee === SPRINT_BUG_UNASSIGNED_LABEL) return 1;
  if (right.assignee === SPRINT_BUG_UNASSIGNED_LABEL) return -1;

  return left.assignee.localeCompare(right.assignee, "es");
}
