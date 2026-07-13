import type { Holiday, HolidayStrategy } from "@/lib/holidays/holiday-strategy";

export class HolidayService {
  constructor(private readonly strategy: HolidayStrategy) {}

  isHoliday(date: Date): Promise<boolean> {
    return this.strategy.isHoliday(date);
  }

  getHoliday(date: Date): Promise<Holiday | null> {
    return this.strategy.getHoliday(date);
  }

  getHolidays(year: number): Promise<Holiday[]> {
    return this.strategy.getHolidays(year);
  }

  async loadColombianHolidaysForRange(
    fromIso: string,
    toIso: string,
  ): Promise<Holiday[]> {
    const fromYear = Number(fromIso.slice(0, 4));
    const toYear = Number(toIso.slice(0, 4));
    if (Number.isNaN(fromYear) || Number.isNaN(toYear)) return [];

    const years = new Set<number>();
    for (let y = fromYear; y <= toYear; y++) years.add(y);

    const batches = await Promise.all(
      Array.from(years).map((y) => this.strategy.getHolidays(y)),
    );
    return batches
      .flat()
      .filter((h) => h.date >= fromIso && h.date <= toIso)
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}