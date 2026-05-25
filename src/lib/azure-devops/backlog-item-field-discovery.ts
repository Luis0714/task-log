import "server-only";

import { adoFetch, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { resolveBacklogWorkItemTypeName } from "@/lib/azure-devops/work-item-type-states";
import type { BacklogResponsableFieldConfig } from "@/lib/azure-devops/backlog-item-fields-config";
import type { BacklogResponsableFieldKey } from "@/lib/work-items/backlog-field-types";

type WitFieldDefinition = {
  referenceName?: string;
  name?: string;
};

type WitFieldsResponse = {
  value?: WitFieldDefinition[];
};

const RESPONSABLE_DEFINITIONS: ReadonlyArray<{
  key: BacklogResponsableFieldKey;
  label: string;
  defaultToCurrentUser: boolean;
  matchName: (normalizedName: string) => boolean;
}> = [
  {
    key: "maquetacion",
    label: "Responsable Maquetación",
    defaultToCurrentUser: true,
    matchName: (name) => name.includes("maquet"),
  },
  {
    key: "integrador",
    label: "Responsable Integrador",
    defaultToCurrentUser: true,
    matchName: (name) => name.includes("integr"),
  },
  {
    key: "qa",
    label: "Responsable QA",
    defaultToCurrentUser: false,
    matchName: (name) => {
      if (name.includes("maquet") || name.includes("integr")) return false;
      return name.includes("responsable") && name.includes("qa");
    },
  },
];

function normalizeFieldLabel(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export async function discoverBacklogResponsableFields(
  auth: AdoCallerAuth,
): Promise<readonly BacklogResponsableFieldConfig[]> {
  const workItemType = resolveBacklogWorkItemTypeName();
  const url = `${adoProjectBase(auth)}/_apis/wit/workitemtypes/${encodeURIComponent(workItemType)}/fields?api-version=7.1`;
  const res = await adoFetch(auth, url);

  if (!res.ok) {
    return [];
  }

  const data = (await res.json()) as WitFieldsResponse;
  const witFields = data.value ?? [];
  const discovered: BacklogResponsableFieldConfig[] = [];

  for (const definition of RESPONSABLE_DEFINITIONS) {
    const match = witFields.find((field) => {
      const referenceName = field.referenceName?.trim();
      const name = field.name?.trim();
      if (!referenceName || !name) return false;
      return definition.matchName(normalizeFieldLabel(name));
    });

    if (match?.referenceName) {
      discovered.push({
        key: definition.key,
        referenceName: match.referenceName,
        label: match.name?.trim() || definition.label,
        defaultToCurrentUser: definition.defaultToCurrentUser,
      });
    }
  }

  return discovered;
}
