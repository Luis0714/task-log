import { describe, expect, it } from "vitest";

import {
  buildSolicitudTitle,
  computeDurationFromRange,
  computeEndFromDuration,
  computeReintegro,
  daysToHours,
  formatDateKeyDMY,
  hoursToDays,
  minutesToTime,
  parseTimeToMinutes,
  resolveAzureHours,
} from "@/lib/solicitudes/time-calc";

// Festivos de referencia usados en varios casos (junio 2026).
const HOLIDAYS = new Set(["2026-06-15"]);

describe("parseTimeToMinutes / minutesToTime", () => {
  it("round-trip de una hora válida", () => {
    expect(parseTimeToMinutes("08:30")).toBe(510);
    expect(minutesToTime(510)).toBe("08:30");
  });

  it("rechaza formatos u horas inválidas", () => {
    expect(parseTimeToMinutes("8:30")).toBeNull();
    expect(parseTimeToMinutes("24:00")).toBeNull();
    expect(parseTimeToMinutes("10:99")).toBeNull();
  });

  it("clampa minutos fuera de rango al fin del día", () => {
    expect(minutesToTime(24 * 60)).toBe("23:59");
    expect(minutesToTime(-5)).toBe("00:00");
  });
});

describe("daysToHours / hoursToDays / resolveAzureHours", () => {
  it("1 día = 8 horas", () => {
    expect(daysToHours(1)).toBe(8);
    expect(daysToHours(2)).toBe(16);
    expect(hoursToDays(24)).toBe(3);
  });

  it("CA-21: convierte días a horas hacia Azure", () => {
    expect(resolveAzureHours(2, "dias")).toBe(16);
  });

  it("mantiene las horas tal cual cuando la unidad es horas", () => {
    expect(resolveAzureHours(2.5, "horas")).toBe(2.5);
  });
});

describe("computeEndFromDuration — horas", () => {
  it("CA-17: 13/06 08:00 + 2 horas → 13/06 10:00", () => {
    const result = computeEndFromDuration({
      startDate: "2026-06-13",
      startTime: "08:00",
      value: 2,
      unit: "horas",
    });
    expect(result).toEqual({ ok: true, endDate: "2026-06-13", endTime: "10:00" });
  });

  it("falla si el tiempo cruza la medianoche (MVP mismo día)", () => {
    const result = computeEndFromDuration({
      startDate: "2026-06-13",
      startTime: "16:00",
      value: 9,
      unit: "horas",
    });
    expect(result).toEqual({ ok: false, reason: "exceeds-day" });
  });

  it("rechaza tiempo <= 0", () => {
    expect(
      computeEndFromDuration({ startDate: "2026-06-13", startTime: "08:00", value: 0, unit: "horas" }),
    ).toEqual({ ok: false, reason: "invalid-input" });
  });
});

describe("computeEndFromDuration — dias", () => {
  it("CA-18: 15/06 + 3 días hábiles con festivo intermedio (15 festivo)", () => {
    // 15 festivo: arranca contando desde 16. 3 días ocupados: 16, 17, 18 → fin 18.
    const result = computeEndFromDuration({
      startDate: "2026-06-16",
      startTime: "08:00",
      value: 3,
      unit: "dias",
      nonWorkingDates: HOLIDAYS,
    });
    expect(result).toEqual({ ok: true, endDate: "2026-06-18", endTime: "08:00" });
  });

  it("1 día = mismo día", () => {
    const result = computeEndFromDuration({
      startDate: "2026-06-16",
      startTime: "08:00",
      value: 1,
      unit: "dias",
    });
    expect(result).toEqual({ ok: true, endDate: "2026-06-16", endTime: "08:00" });
  });

  it("salta fin de semana: viernes + 2 días → martes", () => {
    // Viernes 12: día 1 = 12, día 2 = lunes 15 (festivo → salta) → martes 16.
    const result = computeEndFromDuration({
      startDate: "2026-06-12",
      startTime: "08:00",
      value: 2,
      unit: "dias",
      nonWorkingDates: HOLIDAYS,
    });
    expect(result).toEqual({ ok: true, endDate: "2026-06-16", endTime: "08:00" });
  });
});

describe("computeDurationFromRange", () => {
  it("CA-19 mismo día: diferencia de horas", () => {
    const result = computeDurationFromRange({
      startDate: "2026-06-13",
      startTime: "08:00",
      endDate: "2026-06-13",
      endTime: "10:30",
    });
    expect(result).toEqual({ ok: true, value: 2.5, unit: "horas" });
  });

  it("CA-19 días distintos: días hábiles inclusive en unidad días", () => {
    // 16, 17, 18 hábiles = 3 días (→ 24 h hacia Azure).
    const result = computeDurationFromRange({
      startDate: "2026-06-16",
      startTime: "08:00",
      endDate: "2026-06-18",
      endTime: "08:00",
      nonWorkingDates: HOLIDAYS,
    });
    expect(result).toEqual({ ok: true, value: 3, unit: "dias" });
    if (result.ok) expect(resolveAzureHours(result.value, result.unit)).toBe(24);
  });

  it("mismo día con fin antes que inicio → error", () => {
    const result = computeDurationFromRange({
      startDate: "2026-06-13",
      startTime: "10:00",
      endDate: "2026-06-13",
      endTime: "08:00",
    });
    expect(result).toEqual({ ok: false, reason: "end-before-start" });
  });

  it("fecha fin anterior a inicio → error", () => {
    const result = computeDurationFromRange({
      startDate: "2026-06-18",
      startTime: "08:00",
      endDate: "2026-06-16",
      endTime: "08:00",
    });
    expect(result).toEqual({ ok: false, reason: "end-before-start" });
  });
});

describe("computeReintegro", () => {
  it("CA-23: siguiente hábil tras la fecha fin", () => {
    // Fin jueves 18 → reintegro viernes 19.
    expect(computeReintegro("2026-06-18")).toBe("2026-06-19");
  });

  it("salta fin de semana y festivo: fin viernes → reintegro martes", () => {
    // Viernes 12 → lunes 15 (festivo) → martes 16.
    expect(computeReintegro("2026-06-12", HOLIDAYS)).toBe("2026-06-16");
  });
});

describe("buildSolicitudTitle / formatDateKeyDMY", () => {
  it("formatea la fecha como DD/MM/YYYY", () => {
    expect(formatDateKeyDMY("2026-06-13")).toBe("13/06/2026");
  });

  it("CA-26: [Tipo] – [Persona] – [fecha inicio]", () => {
    expect(
      buildSolicitudTitle({ tipo: "Permiso", persona: "Ana Pérez", startDate: "2026-06-13" }),
    ).toBe("Permiso – Ana Pérez – 13/06/2026");
  });
});
