import type { HoursReportRow } from "@/lib/reports/hours/hours-report-types";

/**
 * Devuelve los `personDisplayName` únicos de las filas del reporte, ordenados
 * alfabéticamente por nombre visible (en `es`). Es la fuente del selector de
 * visibilidad de asignees en la tabla.
 */
export function uniquePersonDisplayNames(
  rows: readonly HoursReportRow[],
): string[] {
  return Array.from(new Set(rows.map((row) => row.personDisplayName))).sort(
    (a, b) => a.localeCompare(b, "es"),
  );
}