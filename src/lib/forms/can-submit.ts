/**
 * Reglas unificadas para habilitar acciones de formulario:
 * - Datos válidos/completos (`isValid`)
 * - Cambios respecto al estado inicial cuando aplica (`requireDirty` + `isDirty`)
 * - Precondiciones externas (catálogos, ADO, etc.)
 * - No estar enviando (`isSubmitting`)
 */
export type CanSubmitInput = {
  isValid: boolean;
  isDirty?: boolean;
  requireDirty?: boolean;
  externalReady?: boolean;
  isSubmitting?: boolean;
};

export function computeCanSubmit({
  isValid,
  isDirty = false,
  requireDirty = false,
  externalReady = true,
  isSubmitting = false,
}: CanSubmitInput): boolean {
  if (isSubmitting || !externalReady || !isValid) return false;
  if (requireDirty && !isDirty) return false;
  return true;
}

/** Formularios de edición: exige cambios + validación + contexto listo. */
export function computeDraftCanSave(
  options: Omit<CanSubmitInput, "requireDirty"> & { isDirty: boolean },
): boolean {
  return computeCanSubmit({ ...options, requireDirty: true });
}
