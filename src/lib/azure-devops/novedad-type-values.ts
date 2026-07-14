import "server-only";

import { adoFetch, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { createTtlCache } from "@/lib/cache/ttl-cache";
import {
  NOVEDAD_FIELDS,
  NOVEDAD_WORK_ITEM_TYPE,
} from "@/lib/azure-devops/novedad-fields";

/**
 * Valores permitidos del campo "Tipo de Novedad" (`Custom.TipodeNovedad`) del
 * WIT Novedades, leídos dinámicamente de la definición del campo en Azure
 * (CA-13/CA-14). La plataforma NO los codifica. Cacheado 1 hora por
 * organización/proyecto. Espejo de `activity-values.ts`.
 */

type FieldResponse = {
  allowedValues?: unknown[];
};

const ONE_HOUR_MS = 60 * 60 * 1000;
const cache = createTtlCache<readonly string[]>(ONE_HOUR_MS);

function cacheKey(auth: AdoCallerAuth): string {
  return `${auth.organization}::${auth.project}`;
}

function toStringValue(entry: unknown): string | null {
  if (typeof entry === "string") {
    const value = entry.trim();
    return value.length > 0 ? value : null;
  }
  if (
    entry &&
    typeof entry === "object" &&
    "value" in entry &&
    typeof (entry as { value?: unknown }).value === "string"
  ) {
    const value = (entry as { value: string }).value.trim();
    return value.length > 0 ? value : null;
  }
  return null;
}

export async function fetchNovedadTypeValues(
  auth: AdoCallerAuth,
): Promise<readonly string[]> {
  const key = cacheKey(auth);
  const cached = cache.get(key);
  if (cached) return cached;

  const url = `${adoProjectBase(auth)}/_apis/wit/workitemtypes/${encodeURIComponent(
    NOVEDAD_WORK_ITEM_TYPE,
  )}/fields/${encodeURIComponent(NOVEDAD_FIELDS.tipo)}?$expand=all&api-version=7.1`;

  const res = await adoFetch(auth, url);
  if (!res.ok) {
    throw new Error("No se pudieron cargar los tipos de solicitud desde Azure.");
  }

  const data = (await res.json()) as FieldResponse;
  const values = (data.allowedValues ?? [])
    .map(toStringValue)
    .filter((value): value is string => value !== null);

  cache.set(key, values);
  return values;
}
