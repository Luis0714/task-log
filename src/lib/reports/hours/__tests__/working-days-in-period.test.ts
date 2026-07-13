import { describe, expect, it } from "vitest";

import { filterWorkingDays } from "@/lib/reports/hours/working-days-in-period";
import type { Holiday } from "@/lib/holidays";

const H = (date: string): Holiday => ({ date, name: "Festivo" });

describe("filterWorkingDays", () => {
  it("excluye fines de semana en una semana completa", () => {
    const result = filterWorkingDays("2026-06-01", "2026-06-07", []);
    expect(result).toEqual([
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
      "2026-06-04",
      "2026-06-05",
    ]);
  });

  it("excluye festivos que caen en día hábil", () => {
    const result = filterWorkingDays("2026-06-01", "2026-06-05", [H("2026-06-03")]);
    expect(result).toEqual(["2026-06-01", "2026-06-02", "2026-06-04", "2026-06-05"]);
  });

  it("festivo en fin de semana no afecta la cuenta", () => {
    const result = filterWorkingDays("2026-06-01", "2026-06-07", [H("2026-06-06")]);
    expect(result).toEqual([
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
      "2026-06-04",
      "2026-06-05",
    ]);
  });

  it("rango inter-anual", () => {
    const result = filterWorkingDays("2025-12-29", "2026-01-05", []);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toBe("2025-12-29");
    expect(result.at(-1)).toBe("2026-01-05");
  });

  it("rango invertido devuelve vacío", () => {
    expect(filterWorkingDays("2026-06-10", "2026-06-01", [])).toEqual([]);
  });

  it("rango de un solo día hábil", () => {
    expect(filterWorkingDays("2026-06-02", "2026-06-02", [])).toEqual(["2026-06-02"]);
  });

  it("rango de un solo día festivo entre semana", () => {
    expect(filterWorkingDays("2026-06-03", "2026-06-03", [H("2026-06-03")])).toEqual([]);
  });
});