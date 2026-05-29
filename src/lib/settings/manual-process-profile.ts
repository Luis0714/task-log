import type { AdoProcessProfile } from "@/lib/azure-devops/process-profile-types";
import { buildWorkItemDateFieldNames } from "@/lib/azure-devops/working-date-field";

export function applyManualProcessProfileChanges(
  current: AdoProcessProfile,
  input: { workingDateField: string; timezone: string },
): AdoProcessProfile {
  const workingDateField = input.workingDateField.trim();
  const timezone = input.timezone.trim();

  return {
    workingDateField,
    workingDateFieldSource: "manual",
    workItemDateFieldNames: buildWorkItemDateFieldNames(workingDateField),
    timezone: timezone || current.timezone,
  };
}
