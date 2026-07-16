import type { ReactNode } from "react";

import { CalendarRange } from "lucide-react";

import { resolveAdoTimeZone } from "@/lib/azure-devops/working-date-field";

const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

const MONTH_ABBREV = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

const MONTH_KEY_PATTERN = /^(\d{4})-(\d{2})$/;
const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})/;

export type DateFilterMode = "month" | "range" | "all";

/** Mes actual en formato `YYYY-MM`. Misma convención que el módulo de
 *  asignaciones para mantener consistencia entre secciones de la app. */
export function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Etiqueta legible para el mes `YYYY-MM`. Si el input no encaja, devuelve el
 *  valor crudo (no se debería mostrar, pero evitamos crashear). */
export function formatMonthLabel(monthKey: string): string {
  const match = MONTH_KEY_PATTERN.exec(monthKey.trim());
  if (!match) return monthKey;
  const [, year, monthNum] = match;
  const idx = Math.max(0, Math.min(11, Number(monthNum) - 1));
  return `${MONTH_NAMES[idx]} de ${year}`;
}

export function formatShortDate(value: string | null): string | null {
  if (!value) return null;
  const match = DATE_KEY_PATTERN.exec(value.slice(0, 10));
  if (match) {
    const [, year, monthNum, day] = match;
    const idx = Math.max(0, Math.min(11, Number(monthNum) - 1));
    return `${Number(day)} ${MONTH_ABBREV[idx]} ${year}`;
  }
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: resolveAdoTimeZone(),
    }).format(date);
  }
  return value;
}

/** Render inline del rango [inicio, fin] con icono de calendario.
 *  - Ambos presentes: `"<inicio> → <fin>"`.
 *  - Solo uno: `"Inicio <x>"` o `"Fin <x>"`.
 *  - Ninguno: `null`. */
export function formatDateRange(
  fechaInicio: string | null,
  fechaFin: string | null,
): ReactNode {
  if (!fechaInicio && !fechaFin) return null;
  let label: string;
  if (fechaInicio && fechaFin) {
    label = `${fechaInicio} → ${fechaFin}`;
  } else if (fechaInicio) {
    label = `Inicio ${fechaInicio}`;
  } else {
    label = `Fin ${fechaFin}`;
  }
  return (
    <span className="inline-flex items-center gap-1">
      <CalendarRange className="size-3" aria-hidden />
      {label}
    </span>
  );
}

/** Subtítulo corto que resume cuántas novedades hay en pantalla,
 *  adaptado al modo activo. */
export function describeReportedCount(
  count: number,
  mode: DateFilterMode,
  monthKey: string,
): string {
  if (mode === "all") {
    if (count === 0) return "Ninguna novedad reportada.";
    if (count === 1) return "1 novedad reportada (sin filtro de periodo).";
    return `${count} novedades reportadas (sin filtro de periodo).`;
  }
  const monthLabel = formatMonthLabel(monthKey);
  if (count === 0) return `Ninguna novedad reportada en ${monthLabel}.`;
  if (count === 1) return `1 novedad reportada en ${monthLabel}.`;
  return `${count} novedades reportadas en ${monthLabel}.`;
}

/**
 * Sencillo stripper de HTML → texto plano. Sin regex frágil: parte por `<`,
 * descarta los segmentos vacíos / tags, y colapsa whitespace + entidades
 * `&nbsp;`. Suficiente para descripciones de Azure (HTML plano).
 */
export function stripHtml(value: string): string {
  const parts = value.split("<");
  const text: string[] = [];
  for (const part of parts) {
    const close = part.indexOf(">");
    text.push(close === -1 ? part : part.slice(close + 1));
  }
  return text
    .join(" ")
    .replaceAll("&nbsp;", " ")
    .replace(/\s+/g, " ")
    .trim();
}
