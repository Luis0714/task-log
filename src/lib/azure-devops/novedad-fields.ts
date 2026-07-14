import "server-only";

import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { listBacklogWitFieldDefinitions } from "@/lib/azure-devops/list-backlog-wit-fields";
import { createTtlCache } from "@/lib/cache/ttl-cache";

/**
 * Configuración de campos del work item type custom "Novedades".
 *
 * Los reference names conocidos están fijos (coinciden con los que ya lee
 * `list-reported-news.ts`). El único que falta descubrir es el de horas
 * ("Tiempo Novedad"): se resuelve dinámicamente por su etiqueta y se cachea,
 * con respaldo en `Completed Work` (el campo de horas que el reporte ya suma).
 */
export const NOVEDAD_WORK_ITEM_TYPE = "Novedades";

export const NOVEDAD_FIELDS = {
  title: "System.Title",
  description: "System.Description",
  assignedTo: "System.AssignedTo",
  state: "System.State",
  areaPath: "System.AreaPath",
  iterationPath: "System.IterationPath",
  tipo: "Custom.TipodeNovedad",
  fechaInicio: "Custom.FechaInicio",
  fechaFin: "Custom.FechaFin",
  fechaReintegro: "Custom.FechaReintegro",
} as const;

/** Campo estándar de horas; respaldo si no se encuentra "Tiempo Novedad". */
export const COMPLETED_WORK_FIELD = "Microsoft.VSTS.Scheduling.CompletedWork";

const ONE_HOUR_MS = 60 * 60 * 1000;
const tiempoFieldCache = createTtlCache<string>(ONE_HOUR_MS);

function normalizeLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function cacheKey(auth: AdoCallerAuth): string {
  return `${auth.organization}::${auth.project}`;
}

/**
 * Reference name del campo de horas "Tiempo Novedad" del WIT Novedades.
 * Busca por etiqueta (exacta primero, luego cualquier campo que contenga
 * "tiempo") y cae en `Completed Work` si no lo encuentra.
 */
export async function resolveTiempoNovedadFieldRef(
  auth: AdoCallerAuth,
): Promise<string> {
  const key = cacheKey(auth);
  const cached = tiempoFieldCache.get(key);
  if (cached) return cached;

  let resolved = COMPLETED_WORK_FIELD;
  try {
    const fields = await listBacklogWitFieldDefinitions(auth, NOVEDAD_WORK_ITEM_TYPE);
    const exact = fields.find((field) => normalizeLabel(field.name) === "tiempo novedad");
    const partial = fields.find((field) => normalizeLabel(field.name).includes("tiempo"));
    resolved = exact?.referenceName ?? partial?.referenceName ?? COMPLETED_WORK_FIELD;
  } catch {
    resolved = COMPLETED_WORK_FIELD;
  }

  tiempoFieldCache.set(key, resolved);
  return resolved;
}
