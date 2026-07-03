import "server-only";

import { discoverBacklogResponsableFields } from "@/lib/azure-devops/backlog-item-field-discovery";
import {
  buildBacklogResponsableFieldsFromEnv,
  PBI_START_DATE_FIELD,
  PBI_TARGET_DATE_FIELD,
  toBacklogResponsableFieldDto,
  type BacklogResponsableFieldConfig,
} from "@/lib/azure-devops/backlog-item-fields-config";
import { listResponsableFieldCandidates } from "@/lib/azure-devops/list-backlog-wit-fields";
import { resolveOrDiscoverProjectConfig } from "@/lib/azure-devops/project-config-resolver";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { resolveBacklogWorkItemTypeName } from "@/lib/azure-devops/work-item-type-states";
import type { AdoBacklogFieldsResponseDto } from "@/lib/schemas/ado-backlog-fields";

export type { BacklogResponsableFieldConfig } from "@/lib/azure-devops/backlog-item-fields-config";
export {
  PBI_START_DATE_FIELD,
  PBI_TARGET_DATE_FIELD,
  RESPONSABLE_ENV_KEYS,
} from "@/lib/azure-devops/backlog-item-fields-config";

let cachedResponsableFields: BacklogResponsableFieldConfig[] | null = null;
let cacheKey: string | null = null;

function buildCacheKey(auth: AdoCallerAuth): string {
  const fromEnv = buildBacklogResponsableFieldsFromEnv();
  const envFingerprint = fromEnv.map((field) => field.referenceName).join("|");
  return `${auth.organization}/${auth.project}|${envFingerprint}`;
}

/**
 * Devuelve los campos Responsable configurados para el proyecto, en este orden:
 * 1) DB (`project_configurations.responsable_fields`) si el admin los configuró.
 * 2) Env vars (`AZDO_PBI_FIELD_*`) — compatibilidad hacia atrás.
 * 3) Auto-discovery desde Azure DevOps.
 *
 * El primer rol en matchear por `referenceName` gana; el resto se descartan.
 */
export async function resolveBacklogResponsableFields(
  auth: AdoCallerAuth,
): Promise<readonly BacklogResponsableFieldConfig[]> {
  const key = buildCacheKey(auth);
  if (cachedResponsableFields && cacheKey === key) {
    return cachedResponsableFields;
  }

  const dbConfig = await resolveOrDiscoverProjectConfig(auth);
  const fromDb: BacklogResponsableFieldConfig[] = (dbConfig.responsableFields ?? []).map((f) => ({
    key: f.key,
    referenceName: f.referenceName,
    label: f.label,
    defaultToCurrentUser: f.defaultToCurrentUser,
  }));

  if (fromDb.length > 0) {
    cachedResponsableFields = fromDb;
    cacheKey = key;
    return fromDb;
  }

  // Fallback a env vars (compatibilidad con proyectos antiguos sin config en BD).
  const fromEnv = buildBacklogResponsableFieldsFromEnv();
  const envKeys = new Set(fromEnv.map((field) => field.key));
  const merged: BacklogResponsableFieldConfig[] = [...fromEnv];

  const discovered = await discoverBacklogResponsableFields(auth);
  for (const field of discovered) {
    if (!envKeys.has(field.key)) {
      merged.push(field);
    }
  }

  cachedResponsableFields = merged;
  cacheKey = key;
  return merged;
}

export async function getBacklogItemFetchFieldNames(
  auth: AdoCallerAuth,
): Promise<readonly string[]> {
  const responsables = await resolveBacklogResponsableFields(auth);
  return [
    PBI_START_DATE_FIELD,
    PBI_TARGET_DATE_FIELD,
    ...responsables.map((field) => field.referenceName),
  ];
}

export async function getBacklogFieldsMetadata(
  auth: AdoCallerAuth,
  workItemType?: string,
): Promise<AdoBacklogFieldsResponseDto> {
  const wit = workItemType ?? resolveBacklogWorkItemTypeName();
  const fromDb = (await resolveOrDiscoverProjectConfig(auth)).responsableFields ?? [];
  const discovered = await discoverBacklogResponsableFields(auth);

  const dbKeys = new Set(fromDb.map((f) => f.key));
  const fields = [
    ...fromDb.map((field) =>
      toBacklogResponsableFieldDto(
        {
          key: field.key,
          referenceName: field.referenceName,
          label: field.label,
          defaultToCurrentUser: field.defaultToCurrentUser,
        },
        "env",
      ),
    ),
    ...discovered
      .filter((field) => !dbKeys.has(field.key))
      .map((field) => toBacklogResponsableFieldDto(field, "discovered")),
  ];

  const responsableCandidates = await listResponsableFieldCandidates(auth, wit);

  return {
    workItemType: wit,
    fields,
    responsableCandidates,
  };
}