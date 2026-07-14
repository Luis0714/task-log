import "server-only";

import { cache } from "react";

import { listTeamSprintsCached } from "@/lib/ado/ado-catalog-cache";
import { loadCatalogCore } from "@/lib/ado/load-catalog-core";
import type { AdoCatalogSnapshot, AdoContextSearchParams } from "@/lib/ado/types";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { pickSprint, type PickSprintOptions } from "@/lib/time-log/context-defaults";

export { EMPTY_ADO_CATALOG } from "@/lib/ado/load-catalog-core";

export type LoadAdoCatalogOptions = PickSprintOptions;

/**
 * Catálogo completo de contexto ADO: el core compartido (proyectos, defaults
 * y equipos) más los sprints del equipo activo.
 */
export const loadAdoCatalog = cache(async function loadAdoCatalog(
  preferredProject: string | null,
  searchParams: AdoContextSearchParams = {},
  options: LoadAdoCatalogOptions = {},
): Promise<AdoCatalogSnapshot> {
  const { snapshot, auth, cacheScope } = await loadCatalogCore(
    preferredProject,
    searchParams,
  );
  if (!auth || !snapshot.team) return snapshot;

  try {
    const sprints = await listTeamSprintsCached(
      withAdoProject(auth, snapshot.project),
      snapshot.team,
      cacheScope,
    );
    return {
      ...snapshot,
      sprints,
      sprintPath: pickSprint(searchParams.sprint ?? "", sprints, options),
    };
  } catch (cause) {
    return {
      ...snapshot,
      errors: {
        ...snapshot.errors,
        sprints:
          cause instanceof Error ? cause.message : "No se pudieron cargar los sprints.",
      },
    };
  }
});
