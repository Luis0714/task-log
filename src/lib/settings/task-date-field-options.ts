import "server-only";

import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { resolveTaskWorkItemTypeName } from "@/lib/azure-devops/work-item-type-states";
import { DEFAULT_WORKING_DATE_FIELD } from "@/lib/azure-devops/working-date-field";
import { isWitDateField, listWorkItemTypeFields } from "@/lib/azure-devops/wit-field-metadata";

export type TaskDateFieldOption = {
  referenceName: string;
  label: string;
};

export async function listTaskDateFieldOptions(
  auth: AdoCallerAuth,
  workItemType?: string,
): Promise<TaskDateFieldOption[]> {
  const fields = await listWorkItemTypeFields(auth, workItemType ?? resolveTaskWorkItemTypeName());

  const options = fields
    .filter((field) => isWitDateField(field))
    .map((field) => ({
      referenceName: field.referenceName!.trim(),
      label: field.name?.trim() || field.referenceName!.trim(),
    }))
    .filter((field) => field.referenceName.length > 0);

  if (!options.some((option) => option.referenceName === DEFAULT_WORKING_DATE_FIELD)) {
    options.push({
      referenceName: DEFAULT_WORKING_DATE_FIELD,
      label: "Fecha de inicio (Start Date)",
    });
  }

  return options.sort((a, b) => a.label.localeCompare(b.label, "es"));
}
