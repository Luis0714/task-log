import { describe, expect, it } from "vitest";

import {
  computeHoursBreakdown,
  computeHoursByDay,
  computeHoursByPerson,
  countsAsWorkedHours,
  sumLoggedHours,
  type WorkedHoursItem,
} from "@/lib/hours/aggregate-hours";

const MON = "2026-06-15";
const TUE = "2026-06-16";
const WED = "2026-06-17";
const SAT = "2026-06-20";
const WEEK_DAYS = new Set([MON, TUE, WED]);

const item = (overrides: WorkedHoursItem = {}): WorkedHoursItem => ({
  state: "In Progress",
  loggedHours: 2,
  workingDate: MON,
  assignedTo: "Ana",
  ...overrides,
});

describe("countsAsWorkedHours", () => {
  it("counts a task with hours in any state, not only Done", () => {
    expect(countsAsWorkedHours(item({ state: "In Progress" }), WEEK_DAYS)).toBe(true);
    expect(countsAsWorkedHours(item({ state: "To Do" }), WEEK_DAYS)).toBe(true);
    expect(countsAsWorkedHours(item({ state: "Closed" }), WEEK_DAYS)).toBe(true);
  });

  it("rejects Removed state (defensive; WIQL already excludes it)", () => {
    expect(countsAsWorkedHours(item({ state: "Removed" }), WEEK_DAYS)).toBe(false);
    expect(countsAsWorkedHours(item({ state: " removed " }), WEEK_DAYS)).toBe(false);
  });

  it("rejects zero, negative, missing and NaN logged hours", () => {
    expect(countsAsWorkedHours(item({ loggedHours: 0 }), WEEK_DAYS)).toBe(false);
    expect(countsAsWorkedHours(item({ loggedHours: -1 }), WEEK_DAYS)).toBe(false);
    expect(countsAsWorkedHours(item({ loggedHours: undefined }), WEEK_DAYS)).toBe(false);
    expect(countsAsWorkedHours(item({ loggedHours: Number.NaN }), WEEK_DAYS)).toBe(false);
  });

  it("rejects working dates outside the working-day calendar (weekend/holiday)", () => {
    expect(countsAsWorkedHours(item({ workingDate: SAT }), WEEK_DAYS)).toBe(false);
    expect(countsAsWorkedHours(item({ workingDate: undefined }), WEEK_DAYS)).toBe(false);
  });
});

describe("computeHoursBreakdown", () => {
  it("applies the same rules to tasks and bugs", () => {
    const breakdown = computeHoursBreakdown({
      tasks: [item({ loggedHours: 3 }), item({ workingDate: SAT, loggedHours: 8 })],
      bugs: [item({ loggedHours: 1.5 }), item({ state: "Removed", loggedHours: 8 })],
      workingDayKeys: WEEK_DAYS,
    });
    expect(breakdown).toEqual({ taskHours: 3, bugHours: 1.5 });
  });

  it("expresses day/week/range variants through the workingDayKeys subset", () => {
    const tasks = [
      item({ workingDate: MON, loggedHours: 1 }),
      item({ workingDate: TUE, loggedHours: 2 }),
      item({ workingDate: WED, loggedHours: 4 }),
    ];
    const singleDay = computeHoursBreakdown({
      tasks,
      bugs: [],
      workingDayKeys: new Set([TUE]),
    });
    const fullRange = computeHoursBreakdown({ tasks, bugs: [], workingDayKeys: WEEK_DAYS });
    expect(singleDay.taskHours).toBe(2);
    expect(fullRange.taskHours).toBe(7);
  });

  it("rounds each bucket to one decimal", () => {
    const breakdown = computeHoursBreakdown({
      tasks: [item({ loggedHours: 0.25 }), item({ loggedHours: 0.25 })],
      bugs: [],
      workingDayKeys: WEEK_DAYS,
    });
    expect(breakdown.taskHours).toBe(0.5);
  });
});

describe("computeHoursByDay", () => {
  it("returns an entry for every working day, zero when nothing was logged", () => {
    const byDay = computeHoursByDay({
      tasks: [item({ workingDate: MON, loggedHours: 2 })],
      bugs: [item({ workingDate: WED, loggedHours: 1 })],
      workingDayKeys: WEEK_DAYS,
    });
    expect([...byDay.keys()]).toEqual([MON, TUE, WED]);
    expect(byDay.get(MON)).toEqual({ taskHours: 2, bugHours: 0 });
    expect(byDay.get(TUE)).toEqual({ taskHours: 0, bugHours: 0 });
    expect(byDay.get(WED)).toEqual({ taskHours: 0, bugHours: 1 });
  });
});

describe("computeHoursByPerson", () => {
  it("groups by the resolved person key and skips null keys", () => {
    const byPerson = computeHoursByPerson(
      {
        tasks: [
          item({ assignedTo: "Ana", loggedHours: 2 }),
          item({ assignedTo: "ana ", loggedHours: 1 }),
          item({ assignedTo: undefined, loggedHours: 8 }),
        ],
        bugs: [item({ assignedTo: "Beto", loggedHours: 3 })],
        workingDayKeys: WEEK_DAYS,
      },
      (assignedTo) => assignedTo?.trim().toLowerCase() ?? null,
    );
    expect(byPerson.get("ana")).toEqual({ taskHours: 3, bugHours: 0 });
    expect(byPerson.get("beto")).toEqual({ taskHours: 0, bugHours: 3 });
    expect(byPerson.size).toBe(2);
  });

  it("only includes people with counted hours", () => {
    const byPerson = computeHoursByPerson(
      {
        tasks: [item({ assignedTo: "Ana", workingDate: SAT })],
        bugs: [],
        workingDayKeys: WEEK_DAYS,
      },
      (assignedTo) => assignedTo ?? null,
    );
    expect(byPerson.size).toBe(0);
  });
});

describe("sumLoggedHours", () => {
  it("sums the visible list without business rules (no state/day filters)", () => {
    const total = sumLoggedHours([
      { loggedHours: 2 },
      { loggedHours: 0.5 },
      { loggedHours: Number.NaN },
      {},
    ]);
    expect(total).toBe(2.5);
  });

  it("returns 0 for an empty list", () => {
    expect(sumLoggedHours([])).toBe(0);
  });
});
