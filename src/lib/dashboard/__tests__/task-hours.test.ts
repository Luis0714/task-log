import { describe, expect, it } from "vitest";

import {
  sumDoneTaskHoursForDay,
  sumDoneTaskHoursThroughDay,
  sumTaskLoggedHours,
  type SprintTaskHoursSource,
} from "@/lib/dashboard/task-hours";

const doneTask = (
  loggedHours: number,
  workingDate: string,
): SprintTaskHoursSource => ({
  state: "Closed",
  loggedHours,
  workingDate,
});

const inProgressTask = (
  loggedHours: number,
  workingDate: string,
): SprintTaskHoursSource => ({
  state: "Active",
  loggedHours,
  workingDate,
});

describe("task-hours", () => {
  it("sumTaskLoggedHours returns 0 for empty array", () => {
    expect(sumTaskLoggedHours([])).toBe(0);
  });

  it("sumDoneTaskHoursForDay returns hours of a single done task on the day", () => {
    expect(sumDoneTaskHoursForDay([doneTask(2.5, "2026-06-16")], "2026-06-16")).toBe(2.5);
  });

  it("sumDoneTaskHoursForDay ignores tasks not yet done", () => {
    expect(sumDoneTaskHoursForDay([inProgressTask(3, "2026-06-16")], "2026-06-16")).toBe(0);
  });

  it("sumDoneTaskHoursForDay ignores done tasks on a different day", () => {
    expect(sumDoneTaskHoursForDay([doneTask(4, "2026-06-17")], "2026-06-16")).toBe(0);
  });

  it("sumDoneTaskHoursForDay sums multiple done tasks on the same day", () => {
    const total = sumDoneTaskHoursForDay(
      [doneTask(1.5, "2026-06-16"), doneTask(0.5, "2026-06-16"), doneTask(2, "2026-06-16")],
      "2026-06-16",
    );
    expect(total).toBe(4);
  });

  it("sumTaskLoggedHours treats NaN loggedHours as 0 (defensive)", () => {
    const total = sumTaskLoggedHours([
      { loggedHours: Number.NaN },
      { loggedHours: 2 },
    ]);
    expect(total).toBe(2);
  });

  it("sumDoneTaskHoursThroughDay accumulates up to and including the day", () => {
    const total = sumDoneTaskHoursThroughDay(
      [doneTask(1, "2026-06-15"), doneTask(2, "2026-06-16"), doneTask(3, "2026-06-17")],
      "2026-06-16",
    );
    expect(total).toBe(3);
  });
});