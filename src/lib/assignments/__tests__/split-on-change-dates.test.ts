import { describe, expect, it } from "vitest";

function previousDay(d: Date): Date {
  const c = new Date(d);
  c.setUTCDate(c.getUTCDate() - 1);
  return c;
}

describe("split on change — cálculo de fecha de cierre de la vigencia anterior", () => {
  it.each([
    { newStart: "2026-07-15T00:00:00Z", expected: "2026-07-14" },
    { newStart: "2026-08-01T00:00:00Z", expected: "2026-07-31" },
    { newStart: "2027-01-01T00:00:00Z", expected: "2026-12-31" },
  ])(
    "cierra el día anterior a $newStart",
    ({ newStart, expected }) => {
      const close = previousDay(new Date(newStart));
      expect(close.toISOString().slice(0, 10)).toBe(expected);
    },
  );
});
