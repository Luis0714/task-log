import { describe, expect, it } from "vitest";

import {
  computeDeviation,
  resolveDeviationLevel,
} from "@/lib/reports/hours/deviation";

describe("resolveDeviationLevel", () => {
  it("100% → exact (cumplimiento exacto)", () => {
    expect(resolveDeviationLevel(100)).toBe("exact");
  });

  it("subcumplimiento leve: desviación ≤ 20%", () => {
    expect(resolveDeviationLevel(99)).toBe("under-light");
    expect(resolveDeviationLevel(95)).toBe("under-light");
    expect(resolveDeviationLevel(80)).toBe("under-light");
  });

  it("subcumplimiento medio: desviación entre 21% y 50%", () => {
    expect(resolveDeviationLevel(79)).toBe("under-medium");
    expect(resolveDeviationLevel(50)).toBe("under-medium");
  });

  it("subcumplimiento fuerte: desviación > 50%", () => {
    expect(resolveDeviationLevel(49)).toBe("under-strong");
    expect(resolveDeviationLevel(0)).toBe("under-strong");
  });

  it("sobrecumplimiento leve: desviación ≤ 20%", () => {
    expect(resolveDeviationLevel(101)).toBe("over-light");
    expect(resolveDeviationLevel(120)).toBe("over-light");
  });

  it("sobrecumplimiento medio: desviación entre 21% y 50%", () => {
    expect(resolveDeviationLevel(121)).toBe("over-medium");
    expect(resolveDeviationLevel(150)).toBe("over-medium");
  });

  it("sobrecumplimiento fuerte: desviación > 50%", () => {
    expect(resolveDeviationLevel(151)).toBe("over-strong");
    expect(resolveDeviationLevel(200)).toBe("over-strong");
  });
});

describe("computeDeviation", () => {
  it("devuelve null cuando no hay cumplimiento", () => {
    expect(computeDeviation(null)).toEqual({ pct: null, level: null });
  });

  it("cumple la tabla de la HU: cubre los valores representativos", () => {
    const cases: ReadonlyArray<{
      compliance: number;
      expectedPct: number;
      expectedLevel:
        | "exact"
        | "under-light"
        | "under-medium"
        | "under-strong"
        | "over-light"
        | "over-medium"
        | "over-strong";
    }> = [
      { compliance: 0, expectedPct: 100, expectedLevel: "under-strong" },
      { compliance: 50, expectedPct: 50, expectedLevel: "under-medium" },
      { compliance: 80, expectedPct: 20, expectedLevel: "under-light" },
      { compliance: 100, expectedPct: 0, expectedLevel: "exact" },
      { compliance: 110, expectedPct: 10, expectedLevel: "over-light" },
      { compliance: 150, expectedPct: 50, expectedLevel: "over-medium" },
      { compliance: 200, expectedPct: 100, expectedLevel: "over-strong" },
    ];
    for (const { compliance, expectedPct, expectedLevel } of cases) {
      expect(computeDeviation(compliance)).toEqual({
        pct: expectedPct,
        level: expectedLevel,
      });
    }
  });

  it("el valor siempre es positivo (magnitud del alejamiento del 100%)", () => {
    expect(computeDeviation(80).pct).toBe(20);
    expect(computeDeviation(120).pct).toBe(20);
    expect(computeDeviation(0).pct).toBe(100);
    expect(computeDeviation(200).pct).toBe(100);
  });

  it("no depende del % de asignación (escenario 50% asignación + 200% cumplimiento)", () => {
    // Persona con 50% de asignación. Si trabajó el doble de lo esperado,
    // su cumplimiento es 200% y la desviación debe ser +100%.
    expect(computeDeviation(200)).toEqual({ pct: 100, level: "over-strong" });
  });
});
