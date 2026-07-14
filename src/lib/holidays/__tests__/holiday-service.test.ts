import { describe, expect, it } from "vitest";

import { DateHolidaysStrategy } from "@/lib/holidays/date-holidays-strategy";
import { HolidayService } from "@/lib/holidays/holiday-service";
import type { HolidayStrategy } from "@/lib/holidays/holiday-strategy";

class FakeStrategy implements HolidayStrategy {
  constructor(private readonly byYear: Map<number, { date: string; name: string }[]>) {}

  async isHoliday(date: Date): Promise<boolean> {
    return (await this.getHoliday(date)) !== null;
  }

  async getHoliday(date: Date): Promise<{ date: string; name: string } | null> {
    const year = date.getFullYear();
    const iso = `${year}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return this.byYear.get(year)?.find((h) => h.date === iso) ?? null;
  }

  async getHolidays(year: number): Promise<{ date: string; name: string }[]> {
    return this.byYear.get(year) ?? [];
  }
}

describe("HolidayService", () => {
  const fake = new FakeStrategy(
    new Map([
      [
        2026,
        [
          { date: "2026-06-08", name: "Corpus Christi" },
          { date: "2026-06-15", name: "Sagrado Corazón" },
          { date: "2026-06-29", name: "San Pedro y San Pablo" },
          { date: "2026-07-20", name: "Independencia" },
        ],
      ],
      [2025, [{ date: "2025-12-25", name: "Navidad" }]],
    ]),
  );

  const service = new HolidayService(fake);

  it("loadColombianHolidaysForRange filtra por rango inclusivo", async () => {
    const result = await service.loadColombianHolidaysForRange("2026-06-01", "2026-06-30");
    expect(result.map((h) => h.date)).toEqual([
      "2026-06-08",
      "2026-06-15",
      "2026-06-29",
    ]);
  });

  it("loadColombianHolidaysForRange cubre rango inter-anual", async () => {
    const result = await service.loadColombianHolidaysForRange("2025-12-01", "2026-01-31");
    const dates = result.map((h) => h.date);
    expect(dates).toContain("2025-12-25");
    expect(dates).not.toContain("2026-07-20");
  });

  it("loadColombianHolidaysForRange devuelve [] para rango inválido", async () => {
    expect(await service.loadColombianHolidaysForRange("abc", "def")).toEqual([]);
  });

  it("delega isHoliday en la estrategia", async () => {
    expect(await service.isHoliday(new Date(2026, 5, 8))).toBe(true);
    expect(await service.isHoliday(new Date(2026, 5, 2))).toBe(false);
  });

  it("delega getHoliday en la estrategia", async () => {
    const result = await service.getHoliday(new Date(2026, 6, 20));
    expect(result?.name).toBe("Independencia");
  });

  it("usa DateHolidaysStrategy en producción con junio 2026 → 3 festivos", async () => {
    const real = new HolidayService(new DateHolidaysStrategy());
    const result = await real.loadColombianHolidaysForRange("2026-06-01", "2026-06-30");
    expect(result).toHaveLength(3);
  });
});