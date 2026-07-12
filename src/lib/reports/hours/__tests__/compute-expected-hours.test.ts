import { describe, expect, it } from "vitest";

import {
  computeExpectedHours,
  type AssignmentSegment,
} from "@/lib/reports/hours/compute-expected-hours";

/** Genera `count` fechas hábiles consecutivas desde `2026-07-01`. */
function workingDays(count: number): string[] {
  const dates: string[] = [];
  for (let day = 1; day <= count; day++) {
    dates.push(`2026-07-${String(day).padStart(2, "0")}`);
  }
  return dates;
}

const openFrom = (pct: number, from = "2026-07-01"): AssignmentSegment => ({
  pct,
  from,
  to: null,
});

describe("computeExpectedHours", () => {
  it("22 días hábiles al 100% → 176 horas (CA-14)", () => {
    const result = computeExpectedHours(workingDays(22), [openFrom(100)]);
    expect(result.workingDays).toBe(22);
    expect(result.expectedHours).toBe(176);
    expect(result.weightedPct).toBe(100);
  });

  it("22 días hábiles al 50% → 88 horas (CA-15, caso cliente)", () => {
    const result = computeExpectedHours(workingDays(22), [openFrom(50)]);
    expect(result.expectedHours).toBe(88);
    expect(result.weightedPct).toBe(50);
  });

  it("calcula por tramos cuando la asignación cambia dentro del periodo (CA-16)", () => {
    const segments: AssignmentSegment[] = [
      { pct: 100, from: "2026-07-01", to: "2026-07-14" },
      { pct: 50, from: "2026-07-15", to: null },
    ];
    const result = computeExpectedHours(workingDays(22), segments);
    // 14 días × 8 × 100% + 8 días × 8 × 50% = 112 + 32 = 144
    expect(result.expectedHours).toBe(144);
    expect(result.weightedPct).toBe(81.8);
  });

  it("los días sin tramo aplicable no suman horas", () => {
    const segments: AssignmentSegment[] = [
      { pct: 100, from: "2026-07-10", to: "2026-07-14" },
    ];
    const result = computeExpectedHours(workingDays(22), segments);
    expect(result.expectedHours).toBe(5 * 8);
  });

  it("sin días hábiles devuelve cero", () => {
    const result = computeExpectedHours([], [openFrom(100)]);
    expect(result).toEqual({ workingDays: 0, expectedHours: 0, weightedPct: 0 });
  });
});
