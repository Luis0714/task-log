import { roundToDecimals } from "@/lib/number/rounding";
import type { SemaforoLevel } from "@/lib/reports/hours/hours-report-types";

/** Umbrales del semáforo (D9), parametrizables a futuro. */
export const SEMAFORO_GREEN_MIN = 95;
export const SEMAFORO_YELLOW_MIN = 80;

export type Compliance = Readonly<{
  /** % de cumplimiento, o `null` si no hay horas esperadas. */
  pct: number | null;
  /** Nivel del semáforo, o `null` cuando no hay % (sin configurar). */
  level: SemaforoLevel | null;
}>;

export function resolveSemaforo(pct: number): SemaforoLevel {
  if (pct >= SEMAFORO_GREEN_MIN) return "verde";
  if (pct >= SEMAFORO_YELLOW_MIN) return "amarillo";
  return "rojo";
}

/**
 * % cumplimiento = (desarrollo + bugs + novedades) ÷ esperadas × 100 (D7).
 * Devuelve `null` cuando no hay horas esperadas (persona sin configuración),
 * para que el reporte lo muestre como "Sin configurar" sin dividir por cero.
 */
export function computeCompliance(
  totalReportedHours: number,
  expectedHours: number,
): Compliance {
  if (expectedHours <= 0) return { pct: null, level: null };
  const pct = roundToDecimals((totalReportedHours / expectedHours) * 100, 1);
  return { pct, level: resolveSemaforo(pct) };
}
