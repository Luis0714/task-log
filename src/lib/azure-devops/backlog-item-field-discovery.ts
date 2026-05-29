import "server-only";

import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import type { BacklogResponsableFieldConfig } from "@/lib/azure-devops/backlog-item-fields-config";
import { findFieldByLabelMatch, listWorkItemTypeFields } from "@/lib/azure-devops/wit-field-metadata";
import { resolveBacklogWorkItemTypeName } from "@/lib/azure-devops/work-item-type-states";
import type { BacklogResponsableFieldKey } from "@/lib/work-items/backlog-field-types";

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
      if (name.includes("maquet") || name.includes("integr") || name.includes("backend")) {
        return false;
      }
      return name.includes("responsable") && name.includes("qa");
    },
  },
];

export async function discoverBacklogResponsableFields(
  auth: AdoCallerAuth,
): Promise<readonly BacklogResponsableFieldConfig[]> {
  const workItemType = resolveBacklogWorkItemTypeName();
  const witFields = await listWorkItemTypeFields(auth, workItemType);
  const discovered: BacklogResponsableFieldConfig[] = [];

  for (const definition of RESPONSABLE_DEFINITIONS) {
    const match = findFieldByLabelMatch(witFields, definition.matchName);

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
