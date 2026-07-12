/**
 * Redondea a `decimals` posiciones decimales (por defecto 1).
 * Centraliza el patrón `Math.round(value * factor) / factor` para evitar
 * duplicarlo por toda la base de código.
 */
export function roundToDecimals(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Redondeo estándar de horas de la app: una posición decimal. */
export function roundHours(value: number): number {
  return roundToDecimals(value, 1);
}
