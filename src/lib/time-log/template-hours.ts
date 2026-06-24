/**
 * Helpers compartidos para el input de "Horas por defecto" en los
 * dialogs de creación/edición de plantillas (admin + per-user).
 *
 * Validamos el mismo rango que `hoursField` en `schemas/time-log.ts`:
 * decimal > 0 y ≤ 24. Vacío es válido (la plantilla no fuerza horas).
 */

export const TEMPLATE_HOURS_MIN = 0;
export const TEMPLATE_HOURS_MAX = 24;

/**
 * `true` si el string es vacío (plantilla no fuerza horas) o si parsea a
 * un número > 0 y ≤ 24. Acepta coma o punto como separador decimal.
 */
export function isValidTemplateHoursString(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return true;
  const parsed = Number.parseFloat(trimmed.replace(",", "."));
  return Number.isFinite(parsed) && parsed > TEMPLATE_HOURS_MIN && parsed <= TEMPLATE_HOURS_MAX;
}

/**
 * Convierte el string del input a `number` o `undefined` (cuando está vacío
 * o es inválido). El caller debe llamar antes a `isValidTemplateHoursString`
 * para garantizar que devuelve un número válido.
 */
export function parseTemplateHoursString(
  raw: string,
): number | undefined {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return undefined;
  const parsed = Number.parseFloat(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}
