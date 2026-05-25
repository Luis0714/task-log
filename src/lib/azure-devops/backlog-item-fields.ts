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

export async function resolveBacklogResponsableFields(
  auth: AdoCallerAuth,
): Promise<readonly BacklogResponsableFieldConfig[]> {
  const key = buildCacheKey(auth);
  if (cachedResponsableFields && cacheKey === key) {
    return cachedResponsableFields;
  }

  const fromEnv = buildBacklogResponsableFieldsFromEnv();
  const envKeys = new Set(fromEnv.map((field) => field.key));
  let merged = [...fromEnv];

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
): Promise<AdoBacklogFieldsResponseDto> {
  const fromEnv = buildBacklogResponsableFieldsFromEnv();
  const envKeys = new Set(fromEnv.map((field) => field.key));
  const discovered = await discoverBacklogResponsableFields(auth);

  const fields = [
    ...fromEnv.map((field) => toBacklogResponsableFieldDto(field, "env")),
    ...discovered
      .filter((field) => !envKeys.has(field.key))
      .map((field) => toBacklogResponsableFieldDto(field, "discovered")),
  ];

  const responsableCandidates = await listResponsableFieldCandidates(auth);

  return {
    workItemType: resolveBacklogWorkItemTypeName(),
    fields,
    responsableCandidates,
  };
}
