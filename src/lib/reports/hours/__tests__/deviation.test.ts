import { describe, expect, it } from "vitest";

import {
  assignmentPctValue,
  computeDeviation,
  resolveDeviationSemaforo,
} from "@/lib/reports/hours/deviation";

describe("assignmentPctValue", () => {
  it("excepción devuelve su % ponderado", () => {
    expect(assignmentPctValue({ kind: "exception", weightedPct: 50 })).toBe(50);
  });

  it("default equivale a 100", () => {
    expect(assignmentPctValue({ kind: "default" })).toBe(100);
  });

  it("sin configurar no tiene valor numérico", () => {
    expect(assignmentPctValue({ kind: "unconfigured" })).toBeNull();
  });
});

describe("resolveDeviationSemaforo", () => {
  it("déficit pequeño es verde", () => {
    expect(resolveDeviationSemaforo(0)).toBe("verde");
    expect(resolveDeviationSemaforo(5)).toBe("verde");
  });

  it("hacer más de lo asignado (desviación negativa) es verde", () => {
    expect(resolveDeviationSemaforo(-5)).toBe("verde");
    expect(resolveDeviationSemaforo(-40)).toBe("verde");
  });

  it("déficit medio es amarillo", () => {
    expect(resolveDeviationSemaforo(12)).toBe("amarillo");
    expect(resolveDeviationSemaforo(20)).toBe("amarillo");
  });

  it("déficit alto es rojo", () => {
    expect(resolveDeviationSemaforo(21)).toBe("rojo");
    expect(resolveDeviationSemaforo(50)).toBe("rojo");
  });
});

describe("computeDeviation", () => {
  it("desviación = asignación − cumplimiento", () => {
    const result = computeDeviation({ kind: "default" }, 88);
    expect(result.pct).toBe(12);
    expect(result.level).toBe("amarillo");
  });

  it("cumplimiento igual a la asignación da 0 (verde)", () => {
    const result = computeDeviation({ kind: "default" }, 100);
    expect(result.pct).toBe(0);
    expect(result.level).toBe("verde");
  });

  it("hacer más de lo asignado no penaliza (desviación negativa, verde)", () => {
    const result = computeDeviation({ kind: "default" }, 130);
    expect(result.pct).toBe(-30);
    expect(result.level).toBe("verde");
  });

  it("usa el % de la excepción como asignación", () => {
    const result = computeDeviation({ kind: "exception", weightedPct: 60 }, 45);
    expect(result.pct).toBe(15);
    expect(result.level).toBe("amarillo");
  });

  it("sin cumplimiento devuelve null", () => {
    expect(computeDeviation({ kind: "default" }, null)).toEqual({
      pct: null,
      level: null,
    });
  });

  it("sin configurar devuelve null", () => {
    expect(computeDeviation({ kind: "unconfigured" }, 90)).toEqual({
      pct: null,
      level: null,
    });
  });
});
