import { describe, expect, it } from "vitest";

import { resolveSprintDay } from "@/lib/date/sprint-day-resolver";

const SPRINT_START = "2026-06-15";
const SPRINT_END = "2026-06-26";
const NO_NON_WORKING: ReadonlySet<string> = new Set();

describe("resolveSprintDay", () => {
  it("resolves 'martes' to the next Tuesday inside the sprint", () => {
    const result = resolveSprintDay({
      text: "el martes",
      startDate: SPRINT_START,
      finishDate: SPRINT_END,
      nonWorkingDates: NO_NON_WORKING,
    });
    expect(result).toEqual({ ok: true, workingDate: "2026-06-16", workingTime: "09:00" });
  });

  it("resolves 'ayer' relative to now", () => {
    const result = resolveSprintDay({
      text: "ayer",
      startDate: "2026-06-01",
      finishDate: "2026-06-30",
      nonWorkingDates: NO_NON_WORKING,
      now: new Date(2026, 5, 18),
    });
    expect(result).toEqual({ ok: true, workingDate: "2026-06-17", workingTime: "09:00" });
  });

  it("resolves an ISO date inside the sprint", () => {
    const result = resolveSprintDay({
      text: "2026-06-19",
      startDate: SPRINT_START,
      finishDate: SPRINT_END,
      nonWorkingDates: NO_NON_WORKING,
    });
    expect(result).toEqual({ ok: true, workingDate: "2026-06-19", workingTime: "09:00" });
  });

  it("rejects Saturday as non_working_day and suggests Monday", () => {
    const result = resolveSprintDay({
      text: "el sábado",
      startDate: SPRINT_START,
      finishDate: SPRINT_END,
      nonWorkingDates: NO_NON_WORKING,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("non_working_day");
      expect(result.suggestion).toBe("2026-06-22");
    }
  });

  it("rejects dates outside the sprint", () => {
    const result = resolveSprintDay({
      text: "2026-05-01",
      startDate: SPRINT_START,
      finishDate: SPRINT_END,
      nonWorkingDates: NO_NON_WORKING,
    });
    expect(result).toEqual({ ok: false, reason: "outside_sprint" });
  });

  it("returns ambiguous for bare day-of-month when sprint spans two months", () => {
    const result = resolveSprintDay({
      text: "el 15",
      startDate: "2026-05-01",
      finishDate: "2026-07-31",
      nonWorkingDates: NO_NON_WORKING,
    });
    expect(result).toEqual({ ok: false, reason: "ambiguous" });
  });

  it("honors a custom non-working date set", () => {
    const result = resolveSprintDay({
      text: "2026-06-19",
      startDate: SPRINT_START,
      finishDate: SPRINT_END,
      nonWorkingDates: new Set(["2026-06-19"]),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("non_working_day");
      expect(result.suggestion).toBe("2026-06-22");
    }
  });

  it("returns invalid_format for empty input", () => {
    const result = resolveSprintDay({
      text: "   ",
      startDate: SPRINT_START,
      finishDate: SPRINT_END,
      nonWorkingDates: NO_NON_WORKING,
    });
    expect(result).toEqual({ ok: false, reason: "invalid_format" });
  });
});