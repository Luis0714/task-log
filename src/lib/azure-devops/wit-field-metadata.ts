import "server-only";

import { adoFetch, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";

export type WitFieldDefinition = {
  referenceName?: string;
  name?: string;
  type?: string | { name?: string };
};

const DATE_FIELD_TYPE_NAMES = new Set(["datetime", "date"]);
const IDENTITY_FIELD_TYPE_NAMES = new Set(["identity"]);

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

function isWitIdentityFieldByType(field: WitFieldDefinition): boolean {
  const rawType = field.type;
  const typeName =
    typeof rawType === "string"
      ? rawType
      : typeof rawType === "object" && rawType
        ? rawType.name
        : undefined;

  if (!typeName) return false;
  return IDENTITY_FIELD_TYPE_NAMES.has(typeName.trim().toLowerCase());
}

export function isWitDateField(field: WitFieldDefinition): boolean {
  if (isWitDateFieldByType(field)) return true;

  const label = field.name?.trim();
  if (!label) return false;

  const normalized = normalizeWitFieldLabel(label);
  return normalized.includes("date") || normalized.includes("fecha");
}

/**
 * Detecta campos de tipo Identity (asignados a una persona o grupo).
 *
 * Si ADO expone el tipo del campo, esa es la fuente de verdad. Solo recurrimos
 * a heurística de label cuando el tipo está ausente (algunos procesos heredados
 * no lo exponen), porque si el tipo viene como `string` o `double` el campo
 * **no** es un identity aunque su label parezca "Responsable".
 */
export function isWitIdentityField(field: WitFieldDefinition): boolean {
  if (field.type !== undefined && field.type !== null) {
    return isWitIdentityFieldByType(field);
  }

  const label = field.name?.trim();
  if (!label) return false;

  const normalized = normalizeWitFieldLabel(label);
  return (
    normalized.includes("assigned to") ||
    normalized.includes("responsable") ||
    normalized.includes("responsible") ||
    normalized.includes("owner") ||
    normalized.includes("asignado")
  );
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
