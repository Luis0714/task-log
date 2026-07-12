import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";

const NAGER_BASE = "https://date.nager.at/api/v3";
const CACHE_TAG_PREFIX = "holidays-co";
const TTL_SECONDS = 60 * 60 * 24 * 30;

/** Festivo de Colombia expuesto por Nager.Date con el formato de la app. */
export type ColombianHoliday = {
  /** YYYY-MM-DD (formato local aplicado por Nager.Date: 2026-07-20). */
  date: string;
  /** Nombre del festivo en español (campo `localName` de Nager.Date). */
  name: string;
};

type NagerHoliday = {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
};

async function fetchFromNager(
  year: number,
  signal?: AbortSignal,
): Promise<ColombianHoliday[]> {
  const res = await fetch(`${NAGER_BASE}/PublicHolidays/${year}/CO`, {
    signal,
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(
      `Nager.Date respondió ${res.status} al pedir festivos ${year}/CO.`,
    );
  }
  const data = (await res.json()) as NagerHoliday[];
  return data
    .filter((item) => item.countryCode === "CO")
    .map((item) => ({
      date: item.date.slice(0, 10),
      name: item.localName || item.name,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Carga los festivos de un año con caché de 30 días (cache de Next.js). */
const loadYearCached = unstable_cache(
  async (year: number) => fetchFromNager(year),
  ["holidays-co"],
  {
    revalidate: TTL_SECONDS,
    tags: [`${CACHE_TAG_PREFIX}-year`],
  },
);

/**
 * Devuelve los festivos colombianos de un año. Misma key de cache para
 * peticiones concurrentes en el mismo render (dedupe vía React.cache +
 * Next.js unstable_cache).
 */
export const loadColombianHolidays = cache(
  async (year: number): Promise<ColombianHoliday[]> => {
    return loadYearCached(year);
  },
);

/** Devuelve los festivos únicos de todos los años en el rango (inclusivo). */
export async function loadColombianHolidaysForRange(
  fromIso: string,
  toIso: string,
): Promise<ColombianHoliday[]> {
  const fromYear = Number(fromIso.slice(0, 4));
  const toYear = Number(toIso.slice(0, 4));
  if (Number.isNaN(fromYear) || Number.isNaN(toYear)) return [];
  const years = new Set<number>();
  for (let y = fromYear; y <= toYear; y++) years.add(y);
  const batches = await Promise.all(
    Array.from(years).map((y) => loadColombianHolidays(y)),
  );
  return batches
    .flat()
    .filter((h) => h.date >= fromIso && h.date <= toIso)
    .sort((a, b) => a.date.localeCompare(b.date));
}
