import { normalizePersonName } from "@/lib/filters/person-name";

export type AssignmentFilterCriteria = {
  personQuery: string;
  projects: readonly string[];
  teams: readonly string[];
};

/** Forma mínima que necesita el filtro de asignaciones (desacopla de la fila). */
type FilterableAssignment = {
  personDisplayName: string;
  projectName: string;
  teamName: string | null;
};

/** ¿El nombre contiene la búsqueda ya normalizada (sin mayúsculas ni tildes)? */
function nameMatches(name: string, normalizedQuery: string): boolean {
  return !normalizedQuery || normalizePersonName(name).includes(normalizedQuery);
}

/**
 * Filtra por nombre de persona. Reutilizable para cualquier lista con
 * `personDisplayName` (filas reales y filas "por defecto").
 */
export function filterByPersonName<T extends { personDisplayName: string }>(
  items: readonly T[],
  personQuery: string,
): T[] {
  const query = normalizePersonName(personQuery);
  if (!query) return [...items];
  return items.filter((item) => nameMatches(item.personDisplayName, query));
}

/** Filtra asignaciones por búsqueda de persona + proyectos + equipos. */
export function filterAssignmentRows<T extends FilterableAssignment>(
  rows: readonly T[],
  { personQuery, projects, teams }: AssignmentFilterCriteria,
): T[] {
  const query = normalizePersonName(personQuery);
  return rows.filter((row) => {
    if (!nameMatches(row.personDisplayName, query)) return false;
    if (projects.length > 0 && !projects.includes(row.projectName)) return false;
    if (
      teams.length > 0 &&
      !(row.teamName !== null && teams.includes(row.teamName))
    ) {
      return false;
    }
    return true;
  });
}
