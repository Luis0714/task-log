import { ADO_FIELD_DEFAULTS } from "@/lib/azure-devops/ado-field-defaults";

/** Campo que Azure exige en la regla TF401320 de Original Estimate. */
export const STANDARD_ORIGINAL_ESTIMATE_FIELD = ADO_FIELD_DEFAULTS.originalEstimateField;

/**
 * Nombres a escribir con las mismas horas que Completed Work.
 * Si el perfil no trae el campo, o trae otro, igual se manda el estándar.
 */
export function originalEstimateFields(configuredField: string | null | undefined): string[] {
  const configured = configuredField?.trim() || null;
  if (!configured || configured === STANDARD_ORIGINAL_ESTIMATE_FIELD) {
    return [STANDARD_ORIGINAL_ESTIMATE_FIELD];
  }
  return [configured, STANDARD_ORIGINAL_ESTIMATE_FIELD];
}
