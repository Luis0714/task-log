import { normalizePersonName } from "@/lib/filters/person-name";
import type { UserWithRole } from "@/lib/db/ports/user.repository.port";

/**
 * Filtra usuarios por coincidencia parcial de nombre o proyecto ADO.
 *
 * - Búsqueda case-insensitive y sin acentos (reusa `normalizePersonName`).
 * - Si `query` queda vacío tras `trim`, devuelve la lista sin cambios.
 * - La comparación es `includes`, no exact-match: "san" matchea con "Sandra".
 */
export function filterAdminUsersByQuery<T extends UserWithRole>(
  users: readonly T[],
  query: string,
): T[] {
  const normalized = normalizePersonName(query);
  if (!normalized) return [...users];

  return users.filter((user) => {
    const displayName = user.displayName ? normalizePersonName(user.displayName) : "";
    if (displayName.includes(normalized)) return true;

    const project = user.project ? normalizePersonName(user.project) : "";
    if (project.includes(normalized)) return true;

    return false;
  });
}
