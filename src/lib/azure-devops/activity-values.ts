import "server-only";

import { adoFetch, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { ADO_FIELD_DEFAULTS } from "@/lib/azure-devops/ado-field-defaults";
import { createTtlCache } from "@/lib/cache/ttl-cache";

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
    const v = entry.trim();
    return v.length > 0 ? v : null;
  }
  if (entry && typeof entry === "object" && "value" in entry && typeof (entry as { value?: unknown }).value === "string") {
    const v = ((entry as { value: string }).value).trim();
    return v.length > 0 ? v : null;
  }
  return null;
}

export async function fetchActivityValues(auth: AdoCallerAuth): Promise<readonly string[]> {
  const key = cacheKey(auth);
  const cached = cache.get(key);
  if (cached) return cached;

  const url = `${adoProjectBase(auth)}/_apis/wit/workitemtypes/${encodeURIComponent(ADO_FIELD_DEFAULTS.taskWorkItemType)}/fields/${encodeURIComponent(ADO_FIELD_DEFAULTS.activityField)}?$expand=all&api-version=7.1`;

  try {
    const res = await adoFetch(auth, url);
    if (!res.ok) return [];

    const data = (await res.json()) as FieldResponse;
    const values = (data.allowedValues ?? [])
      .map(toStringValue)
      .filter((v): v is string => v !== null);

    cache.set(key, values);
    return values;
  } catch {
    return [];
  }
}
