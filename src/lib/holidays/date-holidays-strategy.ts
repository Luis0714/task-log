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
    return (await this.getHoliday(date)) !== null;
  }

  // Compara por clave de fecha (YYYY-MM-DD) y no con `holidays.isHoliday(date)`:
  // la librería fija los límites del festivo en hora de Colombia, así que un
  // Date de medianoche en otra zona horaria (p. ej. CI en UTC) queda fuera
  // del rango aunque sea el mismo día calendario.
  async getHoliday(date: Date): Promise<Holiday | null> {
    const dayKey = toIsoDate(date);
    const holidays = await this.getHolidays(date.getFullYear());
    return holidays.find((h) => h.date === dayKey) ?? null;
  }

  async getHolidays(year: number): Promise<Holiday[]> {
    const list = this.holidays.getHolidays(year) ?? [];
    return list.map((h) => ({
      date: toIsoDate(h.date),
      name: h.name,
    }));
  }
}