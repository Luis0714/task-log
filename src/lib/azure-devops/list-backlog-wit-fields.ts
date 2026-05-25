import "server-only";

import { adoFetch, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { resolveBacklogWorkItemTypeName } from "@/lib/azure-devops/work-item-type-states";

type WitFieldDefinition = {
  referenceName?: string;
  name?: string;
};

type WitFieldsResponse = {
  value?: WitFieldDefinition[];
};

function normalizeFieldLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export async function listBacklogWitFieldDefinitions(
  auth: AdoCallerAuth,
): Promise<Array<{ referenceName: string; name: string }>> {
  const workItemType = resolveBacklogWorkItemTypeName();
  const url = `${adoProjectBase(auth)}/_apis/wit/workitemtypes/${encodeURIComponent(workItemType)}/fields?api-version=7.1`;
  const res = await adoFetch(auth, url);

  if (!res.ok) {
    return [];
  }

  const data = (await res.json()) as WitFieldsResponse;

  return (data.value ?? [])
    .map((field) => ({
      referenceName: field.referenceName?.trim() ?? "",
      name: field.name?.trim() ?? "",
    }))
    .filter((field) => field.referenceName && field.name);
}

export async function listResponsableFieldCandidates(
  auth: AdoCallerAuth,
): Promise<Array<{ referenceName: string; name: string }>> {
  const fields = await listBacklogWitFieldDefinitions(auth);
  return fields
    .filter((field) => normalizeFieldLabel(field.name).includes("responsable"))
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
}
