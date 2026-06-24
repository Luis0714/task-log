import "server-only";

import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import type { BacklogResponsableFieldConfig } from "@/lib/azure-devops/backlog-item-fields-config";
import {
  findFieldByLabelMatch,
  isWitIdentityField,
  listWorkItemTypeFields,
  type WitFieldDefinition,
} from "@/lib/azure-devops/wit-field-metadata";
import { resolveBacklogWorkItemTypeName } from "@/lib/azure-devops/work-item-type-states";
import type { BacklogResponsableFieldKey } from "@/lib/work-items/backlog-field-types";

/** Conjuntos de keywords por rol. Coincidencia case/acentos-insensitive. */
const ROLE_KEYWORDS: Record<BacklogResponsableFieldKey, readonly string[]> = {
  maquetacion: [
    "maquet",
    "disen", // diseño / diseño
    "layout",
    "mockup",
    "front",
  ],
  integrador: [
    "integr",
    "bridge",
    "merge",
    "deploy",
  ],
  qa: [
    "qa",
    "tester",
    "test",
    "quality",
    "reviewer",
    "prueba",
  ],
};

/** Marcadores que identifican al campo como un Responsable/Owner (no cualquier campo con la keyword del rol). */
const RESPONSABLE_MARKERS = [
  "responsable",
  "responsible",
  "owner",
  "lead",
  "asignado",
  "assigned",
];

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function includesAny(haystack: string, needles: readonly string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

type RoleDefinition = {
  key: BacklogResponsableFieldKey;
  label: string;
  defaultToCurrentUser: boolean;
};

const ROLE_DEFINITIONS: readonly RoleDefinition[] = [
  { key: "maquetacion", label: "Responsable Maquetación", defaultToCurrentUser: true },
  { key: "integrador", label: "Responsable Integrador", defaultToCurrentUser: true },
  { key: "qa", label: "Responsable QA", defaultToCurrentUser: false },
];

function findFieldForRole(
  fields: ReadonlyArray<WitFieldDefinition>,
  role: BacklogResponsableFieldKey,
): { referenceName: string; name: string } | undefined {
  const roleKeywords = ROLE_KEYWORDS[role];
  const candidates: Array<{ referenceName: string; name: string; score: number }> = [];

  for (const field of fields) {
    const referenceName = field.referenceName?.trim();
    const name = field.name?.trim();
    if (!referenceName || !name) continue;

    const normalized = normalize(name);
    if (!includesAny(normalized, roleKeywords)) continue;

    // Debe ser un campo de identidad (asignado a una persona) Y parecerse a "Responsable/Owner".
    const isIdentity = isWitIdentityField({
      referenceName,
      name,
      type: field.type,
    });
    if (!isIdentity) continue;

    const hasResponsableMarker = includesAny(normalized, RESPONSABLE_MARKERS);
    if (!hasResponsableMarker) continue; // sin "responsable/owner/assigned", no es un campo Responsable

    // Score: marcador responsable suma puntos; "responsable {rol}" suma extra.
    let score = 1;
    score += 2;
    if (normalized.includes(`responsable ${roleKeywords[0]}`)) score += 1;

    candidates.push({ referenceName, name, score });
  }

  if (candidates.length === 0) return undefined;
  candidates.sort((a, b) => b.score - a.score);
  return {
    referenceName: candidates[0]!.referenceName,
    name: candidates[0]!.name,
  };
}

export async function discoverBacklogResponsableFields(
  auth: AdoCallerAuth,
): Promise<readonly BacklogResponsableFieldConfig[]> {
  const workItemType = resolveBacklogWorkItemTypeName();
  const witFields = await listWorkItemTypeFields(auth, workItemType);
  const discovered: BacklogResponsableFieldConfig[] = [];

  for (const role of ROLE_DEFINITIONS) {
    const match = findFieldForRole(witFields, role.key);

    if (match?.referenceName) {
      discovered.push({
        key: role.key,
        referenceName: match.referenceName,
        label: match.name.trim() || role.label,
        defaultToCurrentUser: role.defaultToCurrentUser,
      });
    }
  }

  return discovered;
}

/** Re-export para no romper call sites que importaban findFieldByLabelMatch desde este archivo. */
export { findFieldByLabelMatch };