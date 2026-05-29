import "server-only";

import { adoFetch, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

export type WitFieldDefinition = {
  referenceName?: string;
  name?: string;
  type?: string | { name?: string };
};

const DATE_FIELD_TYPE_NAMES = new Set(["datetime", "date"]);

function isWitDateFieldByType(field: WitFieldDefinition): boolean {
  const rawType = field.type;
  const typeName =
    typeof rawType === "string"
      ? rawType
      : typeof rawType === "object" && rawType
        ? rawType.name
        : undefined;

  if (!typeName) return false;
  return DATE_FIELD_TYPE_NAMES.has(typeName.trim().toLowerCase());
}

export function isWitDateField(field: WitFieldDefinition): boolean {
  if (isWitDateFieldByType(field)) return true;

  const label = field.name?.trim();
  if (!label) return false;

  const normalized = normalizeWitFieldLabel(label);
  return normalized.includes("date") || normalized.includes("fecha");
}

type WitFieldsResponse = {
  value?: WitFieldDefinition[];
};

export function normalizeWitFieldLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export async function listWorkItemTypeFields(
  auth: AdoCallerAuth,
  workItemType: string,
): Promise<readonly WitFieldDefinition[]> {
  const url = `${adoProjectBase(auth)}/_apis/wit/workitemtypes/${encodeURIComponent(workItemType)}/fields?api-version=7.1`;
  const res = await adoFetch(auth, url);

  if (!res.ok) {
    return [];
  }

  const data = (await res.json()) as WitFieldsResponse;
  return data.value ?? [];
}

export function findFieldByLabelMatch(
  fields: readonly WitFieldDefinition[],
  matchName: (normalizedLabel: string) => boolean,
): WitFieldDefinition | undefined {
  return fields.find((field) => {
    const referenceName = field.referenceName?.trim();
    const name = field.name?.trim();
    if (!referenceName || !name) return false;
    return matchName(normalizeWitFieldLabel(name));
  });
}
