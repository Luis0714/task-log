import { describe, expect, it } from "vitest";

import {
  filterWorkingDays,
  loadHolidayDateKeysInRange,
  loadWorkingDayKeysInRange,
} from "@/lib/hours/load-working-day-keys";
import type { Holiday } from "@/lib/holidays";

const H = (date: string): Holiday => ({ date, name: "Festivo" });

/**
 * Regla de negocio de la plataforma (CA-26/jul-2026): el calendario único de
 * días hábiles sale del holiday service (`@/lib/holidays`, estrategia librería
 * por defecto). Estos tests ejecutan la cadena real (sin mocks) para cerrar el
 * hueco entre los tests unitarios de `filterWorkingDays` y el comportamiento
 * de producción: si la estrategia cambia o se cae, el CI lo detecta antes
 * de que el usuario lo vea en el dashboard/reportes.
 */
describe("loadHolidayDateKeysInRange (cadena real, festivos colombianos 2026)", () => {
  it("incluye el Día de la Independencia (2026-07-20) en julio", async () => {
    const dates = await loadHolidayDateKeysInRange("2026-07-01", "2026-07-31");
    expect(dates).toContain("2026-07-20");
  });

  it("incluye los festivos conocidos del año (Anio Nuevo, Trabajo, Independencia, Navidad)", async () => {
    const dates = await loadHolidayDateKeysInRange("2026-01-01", "2026-12-31");
    expect(dates).toContain("2026-01-01"); // Año Nuevo
    expect(dates).toContain("2026-05-01"); // Día del Trabajador
    expect(dates).toContain("2026-07-20"); // Independencia
    expect(dates).toContain("2026-12-25"); // Navidad
  });

  it("respeta el rango inclusivo: excluye festivos fuera de [from, to]", async () => {
    const dates = await loadHolidayDateKeysInRange("2026-07-15", "2026-07-25");
    expect(dates).toContain("2026-07-20");
    expect(dates).not.toContain("2026-07-13"); // Virgen de Chiquinquirá (fuera)
    expect(dates).not.toContain("2026-08-07"); // Batalla de Boyacá (fuera)
  });
});

describe("loadWorkingDayKeysInRange (cadena real, festivos colombianos 2026)", () => {
  it("excluye el 2026-07-20 (festivo entre semana) de los días hábiles", async () => {
    const workingDays = await loadWorkingDayKeysInRange("2026-07-15", "2026-07-25");
    expect(workingDays).not.toContain("2026-07-20");
  });

  it("incluye los laborables vecinos del 2026-07-20", async () => {
    const workingDays = await loadWorkingDayKeysInRange("2026-07-15", "2026-07-25");
    // lun 15, mar 16, mié 17 (sigue siendo hábil), jue 21, vie 22, lun 23 (sigue hábil)
    // El 18-19 son finde; el 20 es festivo.
    expect(workingDays).toEqual(
      expect.arrayContaining([
        "2026-07-15",
        "2026-07-16",
        "2026-07-17",
        "2026-07-21",
        "2026-07-22",
        "2026-07-23",
        "2026-07-24",
      ]),
    );
  });

  it("excluye fines de semana aunque no haya festivos en el rango", async () => {
    const workingDays = await loadWorkingDayKeysInRange("2026-07-27", "2026-07-31");
    // 27 lun, 28 mar, 29 mié, 30 jue, 31 vie → 5 hábiles; 1-2 ago finde (fuera)
    expect(workingDays).toEqual([
      "2026-07-27",
      "2026-07-28",
      "2026-07-29",
      "2026-07-30",
      "2026-07-31",
    ]);
  });
});

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
