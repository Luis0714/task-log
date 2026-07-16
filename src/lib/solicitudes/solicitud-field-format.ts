import { roundHours } from "@/lib/number/rounding";
import { formatSolicitudDateTime } from "@/lib/solicitudes/time-calc";

/** Equivalencia horas → días (HU-04 Solicitudes y Novedades). */
export const HOURS_PER_DAY = 8;

/** `null`/`NaN` → `"—"`; valor finito → `"<n> h"`. */
export function formatSolicitudHours(hours: number | null): string {
  if (hours === null || !Number.isFinite(hours)) return "—";
  return `${hours} h`;
}

/** `null`/`NaN` → `"—"`; horas convertidas a días con un decimal. */
export function formatSolicitudDays(hours: number | null): string {
  if (hours === null || !Number.isFinite(hours)) return "—";
  return `${roundHours(hours / HOURS_PER_DAY)} d`;
}

/** Wrapper tolerante a `null` para fechas civiles del work item. */
export function formatSolicitudFieldDateTime(
  dateKey: string | null,
  timeStr: string | null,
): string {
  if (!dateKey) return "—";
  return formatSolicitudDateTime(dateKey, timeStr);
}
