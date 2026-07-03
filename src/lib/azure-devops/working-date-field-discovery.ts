import "server-only";

import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { findFieldByLabelMatch, listWorkItemTypeFields } from "@/lib/azure-devops/wit-field-metadata";

function matchesWorkingDateLabel(normalizedName: string): boolean {
  return (
    normalizedName.includes("working date") ||
    normalizedName.includes("fecha de trabajo") ||
    normalizedName === "workingdate"
  );
}

/** Busca un campo de fecha de trabajo en el tipo Task (u otro) por nombre visible. */
export async function discoverWorkingDateFieldReference(
  auth: AdoCallerAuth,
  workItemType: string,
): Promise<string | null> {
  const fields = await listWorkItemTypeFields(auth, workItemType);
  const match = findFieldByLabelMatch(fields, matchesWorkingDateLabel);
  return match?.referenceName?.trim() ?? null;
}
