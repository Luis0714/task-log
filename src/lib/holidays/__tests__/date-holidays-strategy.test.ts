import { describe, expect, it } from "vitest";

import { DateHolidaysStrategy } from "@/lib/holidays/date-holidays-strategy";

describe("DateHolidaysStrategy", () => {
  const strategy = new DateHolidaysStrategy();

  it("getHolidays devuelve los festivos de 2026 con la Ley Emiliani aplicada", async () => {
    const result = await strategy.getHolidays(2026);
    const dates = result.map((h) => h.date);
    expect(dates).toContain("2026-06-08");
    expect(dates).toContain("2026-06-15");
    expect(dates).toContain("2026-06-29");
  });

  it("getHolidays devuelve nombres en español", async () => {
    const result = await strategy.getHolidays(2026);
    const corpus = result.find((h) => h.date === "2026-06-08");
    expect(corpus?.name.toLowerCase()).toContain("corpus");
  });

  it("isHoliday devuelve true para festivo entre semana", async () => {
    const date = new Date(2026, 5, 8);
    expect(await strategy.isHoliday(date)).toBe(true);
  });

  it("isHoliday devuelve false para día normal entre semana", async () => {
    const date = new Date(2026, 5, 2);
    expect(await strategy.isHoliday(date)).toBe(false);
  });

  it("isHoliday devuelve false para fin de semana", async () => {
    const saturday = new Date(2026, 5, 6);
    expect(await strategy.isHoliday(saturday)).toBe(false);
  });

  it("getHoliday devuelve el nombre del festivo", async () => {
    const result = await strategy.getHoliday(new Date(2026, 5, 8));
    expect(result?.date).toBe("2026-06-08");
    expect(result?.name.toLowerCase()).toContain("corpus");
  });

  it("getHoliday devuelve null para día no festivo", async () => {
    const result = await strategy.getHoliday(new Date(2026, 5, 2));
    expect(result).toBeNull();
  });
});