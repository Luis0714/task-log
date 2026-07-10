import { describe, expect, it } from "vitest";

import { monthToDateRange } from "@/lib/assignments/month-range";

describe("monthToDateRange", () => {
  it("convierte un mes de 30 días", () => {
    expect(monthToDateRange("2026-06")).toEqual({
      from: "2026-06-01",
      to: "2026-06-30",
    });
  });

  it("convierte un mes de 31 días", () => {
    expect(monthToDateRange("2026-07")).toEqual({
      from: "2026-07-01",
      to: "2026-07-31",
    });
  });

  it("calcula febrero en año bisiesto", () => {
    expect(monthToDateRange("2028-02")).toEqual({
      from: "2028-02-01",
      to: "2028-02-29",
    });
  });

  it("calcula febrero en año no bisiesto", () => {
    expect(monthToDateRange("2026-02")).toEqual({
      from: "2026-02-01",
      to: "2026-02-28",
    });
  });

  it("rechaza formatos inválidos", () => {
    expect(monthToDateRange("2026-13")).toBeNull();
    expect(monthToDateRange("2026-00")).toBeNull();
    expect(monthToDateRange("2026")).toBeNull();
    expect(monthToDateRange("")).toBeNull();
  });
});
