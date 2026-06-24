import "server-only";

import { adoFetch, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { createTtlCache } from "@/lib/cache/ttl-cache";

/**
 * Forma de cada entrada de `allowedValues` en la respuesta de Azure DevOps
 * `GET /_apis/wit/workitemtypes/{type}/fields/{field}?$expand=allowedValues`.
 *
 * La API REST devuelve objetos `{ id, value, displayValue, type }`. En algunas
 * versiones/configuraciones más viejas puede devolver strings planos; ambos
 * formatos se manejan en `normalizeAllowedValue`.
 */
type AllowedValueEntry = string | { value?: unknown };

type FieldWithAllowedValues = {
  allowedValues?: AllowedValueEntry[];
};

const ONE_HOUR_MS = 60 * 60 * 1000;
const activityCache = createTtlCache<readonly string[]>(ONE_HOUR_MS);

function cacheKey(
  auth: AdoCallerAuth,
  workItemType: string,
  activityField: string,
): string {
  return `${auth.organization}::${auth.project}::${workItemType}::${activityField}`;
}

/**
 * Convierte una entrada de `allowedValues` (string u objeto `{ value }`) al
 * string que la UI muestra como opción. Devuelve `null` si la entrada no es
 * un string válido ni tiene un `.value` string no vacío.
 */
function normalizeAllowedValue(entry: AllowedValueEntry): string | null {
  if (typeof entry === "string") {
    const trimmed = entry.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (entry && typeof entry === "object" && "value" in entry) {
    const raw = entry.value;
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
  }
  return null;
}

/**
 * Devuelve los `allowedValues` reales del campo Activity del proyecto.
 *
 * Importante: hay que pasar el `workItemType` y `activityField` del `processProfile`
 * del proyecto (no los defaults), porque el campo Activity solo existe en
 * procesos Scrum/Agile/CMMI y los valores permitidos los define cada proceso.
 *
 * Devuelve `[]` cuando:
 * - el proyecto no tiene el campo Activity (ej. proceso Basic)
 * - el endpoint falla
 * - el campo existe pero su `allowedValues` está vacío
 *
 * NO hace fallback a una lista hardcodeada: si los valores no se pueden
 * obtener del proyecto, mejor devolver `[]` para que la UI y el agente
 * sepan que no hay valores válidos y no inventen uno que ADO rechazará.
 */
export async function fetchTaskActivityValues(
  auth: AdoCallerAuth,
  workItemType: string,
  activityField: string | null,
): Promise<readonly string[]> {
  const type = workItemType.trim();
  const field = activityField?.trim();
  if (!type || !field) return [];

  const key = cacheKey(auth, type, field);
  const cached = activityCache.get(key);
  if (cached) return cached;

  const values = await fetchFromAdo(auth, type, field);
  activityCache.set(key, values);
  return values;
}

async function fetchFromAdo(
  auth: AdoCallerAuth,
  workItemType: string,
  activityField: string,
): Promise<readonly string[]> {
  const url = `${adoProjectBase(auth)}/_apis/wit/workitemtypes/${encodeURIComponent(workItemType)}/fields/${encodeURIComponent(activityField)}?$expand=allowedValues&api-version=7.1`;

  try {
    const res = await adoFetch(auth, url);
    if (!res.ok) return [];

    const data = (await res.json()) as FieldWithAllowedValues;
    const values = (data.allowedValues ?? [])
      .map(normalizeAllowedValue)
      .filter((v): v is string => v !== null);

    return values;
  } catch {
    return [];
  }
}
