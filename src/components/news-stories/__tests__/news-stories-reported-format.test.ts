import { describe, expect, it } from "vitest";

import { formatShortDate } from "@/components/news-stories/news-stories-reported-format";

describe("formatShortDate", () => {
  it("returns null for null input", () => {
    expect(formatShortDate(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(formatShortDate("")).toBeNull();
  });

  it("formats YYYY-MM-DD without TZ drift (dateKey from splitAdoDateTime)", () => {
    expect(formatShortDate("2026-07-14")).toBe("14 jul 2026");
    expect(formatShortDate("2026-01-05")).toBe("5 ene 2026");
    expect(formatShortDate("2026-12-31")).toBe("31 dic 2026");
  });

  it("handles full ISO timestamps using the project timeZone", () => {
    const result = formatShortDate("2026-07-14T13:00:00.000Z");
    expect(result).not.toBeNull();
    expect(result).toMatch(/^\d{1,2}\s\w{3}\s\d{4}$/);
  });

  it("is independent of runtime local timezone for dateKey input", () => {
    const previousTz = process.env.TZ;
    process.env.TZ = "America/Bogota";
    expect(formatShortDate("2026-07-14")).toBe("14 jul 2026");
    process.env.TZ = "UTC";
    expect(formatShortDate("2026-07-14")).toBe("14 jul 2026");
    if (previousTz === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = previousTz;
    }
  });
});
