import "server-only";

import { cache } from "react";

import { adoFetch, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

type WitFieldsListResponse = {
  value?: Array<{ referenceName?: string }>;
};

type WorkItemsBatchResponse = {
  value?: Array<{
    id: number;
    fields?: Record<string, string | number | undefined>;
  }>;
};

const SYSTEM_FIELD_PREFIXES = ["System.", "Microsoft.VSTS."] as const;

export const listProjectFieldReferenceNames = cache(async function listProjectFieldReferenceNames(
  auth: AdoCallerAuth,
): Promise<ReadonlySet<string>> {
  const url = `${adoProjectBase(auth)}/_apis/wit/fields?api-version=7.1`;
  const res = await adoFetch(auth, url);

  if (!res.ok) {
    return new Set();
  }

  const data = (await res.json()) as WitFieldsListResponse;
  const names = (data.value ?? [])
    .map((field) => field.referenceName?.trim())
    .filter((name): name is string => Boolean(name));

  return new Set(names);
});

function isLikelySystemField(referenceName: string): boolean {
  return SYSTEM_FIELD_PREFIXES.some((prefix) => referenceName.startsWith(prefix));
}

/** Filtra campos custom/inexistentes; los de sistema ADO se conservan. */
export async function filterFieldsToProject(
  auth: AdoCallerAuth,
  requestedFields: readonly string[],
): Promise<string[]> {
  const catalog = await listProjectFieldReferenceNames(auth);
  if (catalog.size === 0) {
    return [...new Set(requestedFields)];
  }

  return [...new Set(requestedFields)].filter(
    (field) => isLikelySystemField(field) || catalog.has(field),
  );
}

const MISSING_FIELD_PATTERN = /Cannot find field ([^.]+)\./;

export function parseMissingFieldReferenceFromAdoError(body: string): string | null {
  const match = body.match(MISSING_FIELD_PATTERN);
  return match?.[1]?.trim() ?? null;
}

export async function fetchWorkItemsBatchWithFieldFallback(
  auth: AdoCallerAuth,
  ids: number[],
  requestedFields: readonly string[],
): Promise<WorkItemsBatchResponse> {
  if (ids.length === 0) {
    return { value: [] };
  }

  let fields = await filterFieldsToProject(auth, requestedFields);
  const maxAttempts = Math.max(fields.length, 1);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const url = `${adoProjectBase(auth)}/_apis/wit/workitems?ids=${ids.join(",")}&fields=${encodeURIComponent(fields.join(","))}&api-version=7.1`;
    const res = await adoFetch(auth, url);

    if (res.ok) {
      return (await res.json()) as WorkItemsBatchResponse;
    }

    const body = await res.text();
    const missingField = parseMissingFieldReferenceFromAdoError(body);

    if (res.status === 400 && missingField && fields.includes(missingField)) {
      fields = fields.filter((field) => field !== missingField);
      continue;
    }

    const snippet = body.trim().slice(0, 240);
    throw new Error(
      snippet ? `HTTP ${res.status}: ${snippet}` : `HTTP ${res.status}: No se pudieron cargar los work items.`,
    );
  }

  throw new Error("No se pudieron cargar los work items tras filtrar campos inválidos.");
}
