import "server-only";

import { cache } from "react";

import { loadCatalogCore } from "@/lib/ado/load-catalog-core";
import type { AdoCatalogSnapshot, AdoContextSearchParams } from "@/lib/ado/types";

/**
 * Equivalente de `loadAdoCatalog` para páginas sin contexto de sprint
 * (asignaciones, novedades, solicitudes): resuelve proyectos, defaults y
 * equipos (incluido el mapa por proyecto) sin cargar sprints.
 */
export const loadAssignmentsCatalog = cache(async function loadAssignmentsCatalog(
  searchParams: AdoContextSearchParams = {},
): Promise<AdoCatalogSnapshot> {
  const { snapshot } = await loadCatalogCore(null, searchParams);
  return snapshot;
});
