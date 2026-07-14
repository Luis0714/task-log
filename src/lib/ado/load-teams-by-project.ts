import "server-only";

import { listProjectTeamsCached } from "@/lib/ado/ado-catalog-cache";
import { withAdoProject } from "@/lib/azure-devops/projects";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import type { AdoTeamDto } from "@/lib/schemas/ado-catalog";

/**
 * Equipos de cada proyecto, indexados por nombre. Un proyecto cuyo listado
 * falla aporta lista vacía para no tumbar el catálogo completo.
 */
export async function loadTeamsByProject(
  auth: AdoCallerAuth,
  projectNames: readonly string[],
  cacheScope: string | null,
): Promise<Record<string, AdoTeamDto[]>> {
  const entries = await Promise.all(
    projectNames.map(async (projectName) => {
      const teams = await listProjectTeamsCached(
        withAdoProject(auth, projectName),
        cacheScope,
      ).catch(() => []);
      return [projectName, teams] as const;
    }),
  );
  return Object.fromEntries(entries);
}
