import { describe, expect, it } from "vitest";

import {
  computeCompliance,
  resolveSemaforo,
} from "@/lib/reports/hours/compliance";

describe("computeCompliance", () => {
  it("88 reportadas / 88 esperadas → 100% verde (caso cliente)", () => {
    expect(computeCompliance(88, 88)).toEqual({ pct: 100, level: "verde" });
  });

  it("sin horas esperadas devuelve null (sin configurar)", () => {
    expect(computeCompliance(40, 0)).toEqual({ pct: null, level: null });
  });

  it("redondea el porcentaje a un decimal", () => {
    expect(computeCompliance(60, 88).pct).toBe(68.2);
  });
});

describe("resolveSemaforo", () => {
  it.each([
    [95, "verde"],
    [100, "verde"],
    [94.9, "amarillo"],
    [80, "amarillo"],
    [79.9, "rojo"],
    [0, "rojo"],
  ])("%d%% → %s", (pct, expected) => {
    expect(resolveSemaforo(pct)).toBe(expected);
  });
});
