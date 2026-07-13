import { describe, expect, it } from "vitest";

import {
  countWorkingDayKeysBetween,
  filterWorkingDayKeys,
  isWeekendKey,
  isWorkingDayKey,
  listWorkingDayKeysBetween,
  parseLocalDateKey,
  toLocalDateKey,
} from "@/lib/working-days";

describe("isWeekendKey", () => {
  it("devuelve false para lunes a viernes", () => {
    expect(isWeekendKey("2026-06-01")).toBe(false);
    expect(isWeekendKey("2026-06-02")).toBe(false);
    expect(isWeekendKey("2026-06-03")).toBe(false);
    expect(isWeekendKey("2026-06-04")).toBe(false);
    expect(isWeekendKey("2026-06-05")).toBe(false);
  });

  it("devuelve true para sábado y domingo", () => {
    expect(isWeekendKey("2026-06-06")).toBe(true);
    expect(isWeekendKey("2026-06-07")).toBe(true);
  });

  it("devuelve false para una clave mal formada", () => {
    expect(isWeekendKey("not-a-date")).toBe(false);
    expect(isWeekendKey("2026-13-01")).toBe(false);
  });
});

describe("isWorkingDayKey", () => {
  it("false para sábado y domingo aunque no haya festivos", () => {
    expect(isWorkingDayKey("2026-06-06")).toBe(false);
    expect(isWorkingDayKey("2026-06-07")).toBe(false);
  });

  it("true para lunes sin festivo", () => {
    expect(isWorkingDayKey("2026-06-01")).toBe(true);
  });

  it("false para festivo entre semana", () => {
    const nonWorking = new Set(["2026-06-01"]);
    expect(isWorkingDayKey("2026-06-01", { nonWorkingDates: nonWorking })).toBe(false);
  });
});

describe("filterWorkingDayKeys", () => {
  it("conserva solo los días laborables", () => {
    const input = [
      "2026-06-01",
      "2026-06-06",
      "2026-06-07",
      "2026-06-08",
    ];
    const result = filterWorkingDayKeys(input, {
      nonWorkingDates: new Set(["2026-06-08"]),
    });
    expect(result).toEqual(["2026-06-01"]);
  });

  it("devuelve [] si todo el rango cae en finde/festivo", () => {
    const result = filterWorkingDayKeys(["2026-06-06", "2026-06-07"]);
    expect(result).toEqual([]);
  });
});

describe("listWorkingDayKeysBetween", () => {
  it("excluye fines de semana en una semana completa", () => {
    const result = listWorkingDayKeysBetween("2026-06-01", "2026-06-07");
    expect(result).toEqual([
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
      "2026-06-04",
      "2026-06-05",
    ]);
  });

  it("excluye festivos que caen en día hábil", () => {
    const result = listWorkingDayKeysBetween("2026-06-01", "2026-06-05", {
      nonWorkingDates: new Set(["2026-06-03"]),
    });
    expect(result).toEqual([
      "2026-06-01",
      "2026-06-02",
      "2026-06-04",
      "2026-06-05",
    ]);
  });

  it("festivo en fin de semana no afecta la cuenta", () => {
    const result = listWorkingDayKeysBetween("2026-06-01", "2026-06-07", {
      nonWorkingDates: new Set(["2026-06-06"]),
    });
    expect(result).toEqual([
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
      "2026-06-04",
      "2026-06-05",
    ]);
  });

  it("rango invertido devuelve vacío", () => {
    expect(listWorkingDayKeysBetween("2026-06-10", "2026-06-01")).toEqual([]);
  });

  it("rango de un solo día hábil", () => {
    expect(listWorkingDayKeysBetween("2026-06-02", "2026-06-02")).toEqual(["2026-06-02"]);
  });

  it("rango de un solo día festivo entre semana", () => {
    expect(
      listWorkingDayKeysBetween("2026-06-03", "2026-06-03", {
        nonWorkingDates: new Set(["2026-06-03"]),
      }),
    ).toEqual([]);
  });

  it("junio 2026 con festivos colombianos da 19 días hábiles (regresión)", () => {
    const result = countWorkingDayKeysBetween("2026-06-01", "2026-06-30", {
      nonWorkingDates: new Set([
        "2026-06-08",
        "2026-06-15",
        "2026-06-29",
      ]),
    });
    expect(result).toBe(19);
  });
});

describe("parseLocalDateKey + toLocalDateKey", () => {
  it("round-trip preserva la fecha", () => {
    const date = parseLocalDateKey("2026-06-15");
    expect(date).not.toBeNull();
    expect(toLocalDateKey(date!)).toBe("2026-06-15");
  });

  it("devuelve null para claves con formato inválido", () => {
    expect(parseLocalDateKey("")).toBeNull();
    expect(parseLocalDateKey("2026-6-1")).toBeNull();
    expect(parseLocalDateKey("abc")).toBeNull();
  });
});