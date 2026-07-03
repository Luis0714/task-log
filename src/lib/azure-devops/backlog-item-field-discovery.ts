import "server-only";

import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import type { BacklogResponsableFieldConfig } from "@/lib/azure-devops/backlog-item-fields-config";
import {
  isWitIdentityField,
  listWorkItemTypeFields,
} from "@/lib/azure-devops/wit-field-metadata";
import { resolveBacklogWorkItemTypeName } from "@/lib/azure-devops/work-item-type-states";

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/**
 * Detecta campos "Responsable/Owner" en el work item type. **Genérico**: no
 * asume roles concretos (Maquetación/Integrador/QA). Devuelve cualquier campo
 * de tipo Identity cuyo label contiene un marcador "responsable/responsible/
 * owner/lead".
 *
 * Cada campo descubierto se etiqueta con `defaultToCurrentUser = true` por
 * defecto; el admin puede sobreescribirlo desde Configuración.
 */
export async function discoverBacklogResponsableFields(
  auth: AdoCallerAuth,
): Promise<readonly BacklogResponsableFieldConfig[]> {
  const workItemType = resolveBacklogWorkItemTypeName();
  const witFields = await listWorkItemTypeFields(auth, workItemType);

  const discovered: BacklogResponsableFieldConfig[] = [];

  for (const field of witFields) {
    const referenceName = field.referenceName?.trim();
    const name = field.name?.trim();
    if (!referenceName || !name) continue;

    if (!isWitIdentityField({ referenceName, name, type: field.type })) continue;
    if (!containsResponsableMarker(name)) continue;

    discovered.push({
      key: referenceName,
      referenceName,
      label: name,
      defaultToCurrentUser: true,
    });
  }

  return discovered;
}

const RESPONSABLE_MARKERS = [
  "responsable",
  "responsible",
  "owner",
  "lead",
];

function containsResponsableMarker(label: string): boolean {
  const normalized = normalize(label);
  if (!normalized) return false;
  return RESPONSABLE_MARKERS.some((marker) => normalized.includes(marker));
}