import "server-only";

import Holidays from "date-holidays";

import type { Holiday, HolidayStrategy } from "@/lib/holidays/holiday-strategy";

function toIsoDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export class DateHolidaysStrategy implements HolidayStrategy {
  private readonly holidays: Holidays;

  constructor() {
    this.holidays = new Holidays("CO");
    this.holidays.setLanguages("es");
  }

  async isHoliday(date: Date): Promise<boolean> {
    return this.holidays.isHoliday(date) !== false;
  }

  async getHoliday(date: Date): Promise<Holiday | null> {
    const result = this.holidays.isHoliday(date);
    if (result === false || !Array.isArray(result) || result.length === 0) {
      return null;
    }
    const first = result[0];
    return {
      date: toIsoDate(first.date),
      name: first.name,
    };
  }

  async getHolidays(year: number): Promise<Holiday[]> {
    const list = this.holidays.getHolidays(year) ?? [];
    return list.map((h) => ({
      date: toIsoDate(h.date),
      name: h.name,
    }));
  }
}