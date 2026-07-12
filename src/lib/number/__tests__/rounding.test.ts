import { describe, expect, it } from "vitest";

import { roundHours, roundToDecimals } from "@/lib/number/rounding";

describe("roundToDecimals", () => {
  it("redondea al número de decimales indicado", () => {
    expect(roundToDecimals(81.8181, 1)).toBe(81.8);
    expect(roundToDecimals(68.1818, 2)).toBe(68.18);
    expect(roundToDecimals(100, 1)).toBe(100);
  });
});

describe("roundHours", () => {
  it("redondea horas a una posición decimal", () => {
    expect(roundHours(87.96)).toBe(88);
    expect(roundHours(8.04)).toBe(8);
    expect(roundHours(2.35)).toBe(2.4);
  });
});
