import { roundToDecimals } from "@/lib/number/rounding";

/**
 * % de desviación respecto al objetivo del 100% de cumplimiento.
 *
 * La dirección (sub / sobre cumplimiento) NO se codifica en el signo — la
 * desviación siempre se reporta como magnitud positiva. La dirección vive en
 * `DeviationLevel` para que el badge pueda pintarse de rojo (incumplimiento),
 * verde (exacto) o azul (sobrecumplimiento).
 *
 * Importante: NO usamos el % de asignación aquí, porque ya quedó incorporado
 * dentro de las horas esperadas que alimentan `computeCompliance`. Restarlo
 * otra vez produciría valores incorrectos (ej. 50% asignación + 200%
 * cumplimiento daba -150% en lugar del esperado |100 - 200| = 100%).
 *
 * Umbrales de intensidad por magnitud de la desviación:
 *   - light  (claro):  ≤ 20%  →  ej. 110% cumplimiento (desviación 10%)
 *   - medium (medio):  ≤ 50%  →  ej. 50% cumplimiento (desviación 50%)
 *   - strong (intenso): > 50% →  ej. 200% cumplimiento (desviación 100%)
 */
export const DEVIATION_GREEN_MAX = 20;
export const DEVIATION_YELLOW_MAX = 50;

/** Dirección + magnitud de la desviación, en una sola etiqueta. */
export type DeviationLevel =
  | "exact"
  | "under-light"
  | "under-medium"
  | "under-strong"
  | "over-light"
  | "over-medium"
  | "over-strong";

export type Deviation = Readonly<{
  pct: number | null;
  level: DeviationLevel | null;
}>;

/**
 * Decodifica el `compliancePct` en una `DeviationLevel`. La dirección la toma
 * del signo de `compliancePct - 100`; la magnitud cae en los mismos buckets
 * que el semáforo histórico (5% / 20%).
 */
export function resolveDeviationLevel(compliancePct: number): DeviationLevel {
  const signedDelta = compliancePct - 100;
  if (signedDelta === 0) return "exact";
  const intensity = resolveDeviationIntensity(Math.abs(signedDelta));
  return signedDelta < 0 ? `under-${intensity}` : `over-${intensity}`;
}

function resolveDeviationIntensity(
  magnitude: number,
): "light" | "medium" | "strong" {
  if (magnitude <= DEVIATION_GREEN_MAX) return "light";
  if (magnitude <= DEVIATION_YELLOW_MAX) return "medium";
  return "strong";
}

export function computeDeviation(compliancePct: number | null): Deviation {
  if (compliancePct === null) return { pct: null, level: null };
  const pct = roundToDecimals(Math.abs(compliancePct - 100), 1);
  return { pct, level: resolveDeviationLevel(compliancePct) };
}
