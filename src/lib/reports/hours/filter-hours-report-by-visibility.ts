import type { HoursReportResult } from "@/lib/reports/hours/hours-report-types";

/**
 * Excluye del reporte las filas de personas ocultas (mismo patrón que
 * `filterSprintTimesByVisibility`). La usan la tabla y el POST del Excel,
 * de modo que ambos reflejen exactamente lo mismo.
 */
export function filterHoursReportByVisibility(
  result: HoursReportResult,
  hiddenPersons: ReadonlySet<string>,
): HoursReportResult {
  if (hiddenPersons.size === 0) return result;
  return {
    ...result,
    rows: result.rows.filter(
      (row) => !hiddenPersons.has(row.personDisplayName),
    ),
  };
}
