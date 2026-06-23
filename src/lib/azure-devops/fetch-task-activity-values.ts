import "server-only";

import { adoFetch, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { createTtlCache } from "@/lib/cache/ttl-cache";

type FieldWithAllowedValues = {
  allowedValues?: unknown[];
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
    const values = (data.allowedValues ?? []).filter(
      (v): v is string => typeof v === "string" && v.trim().length > 0,
    );

    return values;
  } catch {
    return [];
  }
}
