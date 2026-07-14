import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";

import type { Holiday, HolidayStrategy } from "@/lib/holidays/holiday-strategy";

const NAGER_BASE = "https://date.nager.at/api/v3";
const TTL_SECONDS = 60 * 60 * 24 * 30;

type NagerHoliday = {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
};

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function fetchFromNager(year: number): Promise<Holiday[]> {
  const res = await fetch(`${NAGER_BASE}/PublicHolidays/${year}/CO`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Nager.Date respondió ${res.status} al pedir festivos ${year}/CO.`);
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

const loadYearCached = unstable_cache(
  async (year: number) => fetchFromNager(year),
  ["holidays-co"],
  {
    revalidate: TTL_SECONDS,
    tags: ["holidays-co-year"],
  },
);

const loadColombianHolidays = cache(
  async (year: number): Promise<Holiday[]> => loadYearCached(year),
);

export class HolidayApiStrategy implements HolidayStrategy {
  async isHoliday(date: Date): Promise<boolean> {
    return (await this.getHoliday(date)) !== null;
  }

  async getHoliday(date: Date): Promise<Holiday | null> {
    const yearHolidays = await loadColombianHolidays(date.getFullYear());
    const iso = toIsoDate(date);
    return yearHolidays.find((h) => h.date === iso) ?? null;
  }

  async getHolidays(year: number): Promise<Holiday[]> {
    return loadColombianHolidays(year);
  }
}