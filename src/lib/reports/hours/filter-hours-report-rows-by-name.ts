import { normalizePersonName } from "@/lib/filters/person-name";
import type { HoursReportRow } from "@/lib/reports/hours/hours-report-types";

/**
 * Filtra las filas visibles por nombre de persona, ignorando mayúsculas,
 * acentos y espacios. Misma normalización que `findTeamMemberByAssigneeName`
 * para que "Ana" / "ana" / "ÁNA" coincidan.
 */
export function filterHoursReportRowsByName(
  rows: readonly HoursReportRow[],
  nameFilter: string,
): HoursReportRow[] {
  const query = normalizePersonName(nameFilter);
  if (!query) return [...rows];
  return rows.filter((row) =>
    normalizePersonName(row.personDisplayName).includes(query),
  );
}