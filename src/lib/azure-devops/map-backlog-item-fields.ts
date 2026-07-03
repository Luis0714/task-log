import {
  PBI_START_DATE_FIELD,
  PBI_TARGET_DATE_FIELD,
  type BacklogResponsableFieldConfig,
} from "@/lib/azure-devops/backlog-item-fields-config";
import { parseIdentityDisplayName } from "@/lib/azure-devops/identity-field";
import { toWorkingDateKey } from "@/lib/azure-devops/working-date-field";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

/** Keys legacy mantenidos por retro-compatibilidad. Los campos nuevos leen
 *  los Responsables por `referenceName` directamente del work item. */
const LEGACY_DTO_KEYS: Record<string, keyof AdoWorkItemOptionDto> = {
  maquetacion: "responsableMaquetacion",
  integrador: "responsableIntegrador",
  qa: "responsableQA",
};

export type MappedBacklogItemFields = {
  startDate?: string;
  targetDate?: string;
  /** Responsables por `referenceName` del campo en el proceso. */
  responsables: Record<string, string>;
  /** @deprecated usar `responsables`. Mantenido para componentes legacy. */
  responsableMaquetacion?: string;
  responsableIntegrador?: string;
  responsableQA?: string;
};

export function mapBacklogItemFields(
  fields: Record<string, string | number | undefined> | undefined,
  responsables: readonly BacklogResponsableFieldConfig[],
): MappedBacklogItemFields {
  const mapped: MappedBacklogItemFields = {
    startDate: toWorkingDateKey(fields?.[PBI_START_DATE_FIELD]),
    targetDate: toWorkingDateKey(fields?.[PBI_TARGET_DATE_FIELD]),
    responsables: {},
  };

  for (const config of responsables) {
    const value = parseIdentityDisplayName(fields?.[config.referenceName]);
    if (!value) continue;
    mapped.responsables[config.referenceName] = value;

    const legacyKey = LEGACY_DTO_KEYS[String(config.key)];
    if (legacyKey) {
      (mapped as Record<string, unknown>)[legacyKey] = value;
    }
  }

  return mapped;
}