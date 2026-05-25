import {
  PBI_START_DATE_FIELD,
  PBI_TARGET_DATE_FIELD,
  type BacklogResponsableFieldConfig,
} from "@/lib/azure-devops/backlog-item-fields-config";
import { parseIdentityDisplayName } from "@/lib/azure-devops/identity-field";
import { toWorkingDateKey } from "@/lib/azure-devops/working-date-field";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

const RESPONSABLE_DTO_KEYS = {
  maquetacion: "responsableMaquetacion",
  integrador: "responsableIntegrador",
  qa: "responsableQA",
} as const;

export function mapBacklogItemFields(
  fields: Record<string, string | number | undefined> | undefined,
  responsables: readonly BacklogResponsableFieldConfig[],
): Pick<
  AdoWorkItemOptionDto,
  | "startDate"
  | "targetDate"
  | "responsableMaquetacion"
  | "responsableIntegrador"
  | "responsableQA"
> {
  const mapped: Pick<
    AdoWorkItemOptionDto,
    "startDate" | "targetDate" | "responsableMaquetacion" | "responsableIntegrador" | "responsableQA"
  > = {
    startDate: toWorkingDateKey(fields?.[PBI_START_DATE_FIELD]),
    targetDate: toWorkingDateKey(fields?.[PBI_TARGET_DATE_FIELD]),
  };

  for (const config of responsables) {
    const dtoKey = RESPONSABLE_DTO_KEYS[config.key];
    const value = parseIdentityDisplayName(fields?.[config.referenceName]);
    if (value) {
      mapped[dtoKey] = value;
    }
  }

  return mapped;
}
