import { describe, expect, it } from "vitest";

import {
  EMPTY_HOURS_BREAKDOWN,
  sumHoursBreakdowns,
  totalHoursBreakdown,
} from "@/lib/hours/hours-breakdown";

describe("totalHoursBreakdown", () => {
  it("suma tasks y bugs con redondeo a un decimal", () => {
    expect(totalHoursBreakdown({ taskHours: 2.25, bugHours: 1.25 })).toBe(3.5);
  });

  it("devuelve 0 para el desglose vacío", () => {
    expect(totalHoursBreakdown(EMPTY_HOURS_BREAKDOWN)).toBe(0);
  });
});

describe("sumHoursBreakdowns", () => {
  it("agrega varios desgloses campo a campo", () => {
    const total = sumHoursBreakdowns([
      { taskHours: 1.5, bugHours: 0.5 },
      { taskHours: 2, bugHours: 1 },
    ]);
    expect(total).toEqual({ taskHours: 3.5, bugHours: 1.5 });
  });

  it("devuelve el desglose vacío para una lista vacía", () => {
    expect(sumHoursBreakdowns([])).toEqual(EMPTY_HOURS_BREAKDOWN);
  });
});
