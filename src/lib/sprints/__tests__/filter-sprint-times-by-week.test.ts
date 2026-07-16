import { describe, expect, it } from "vitest";

import {
  filterSprintTimesByWeek,
  parseSprintTimesWeekSelection,
  resolveWeekExpectedHours,
  SPRINT_TIMES_WEEK_ALL,
} from "@/lib/sprints/filter-sprint-times-by-week";
import type {
  SprintTimesMetrics,
  SprintTimesPersonRow,
} from "@/lib/sprints/sprint-stats-types";

function makeRow(overrides: Partial<SprintTimesPersonRow> = {}): SprintTimesPersonRow {
  return {
    assignee: "Ana Gómez",
    weeks: [
      { taskHours: 30, bugHours: 5, newsHours: 0 },
      { taskHours: 10, bugHours: 0, newsHours: 8 },
    ],
    sprint: { taskHours: 40, bugHours: 5, newsHours: 8 },
    expectedHours: 72,
    expectedHoursByWeek: [40, 32],
    compliancePct: 73.6,
    semaforo: "rojo",
    ...overrides,
  };
}

function makeTimes(rows: SprintTimesPersonRow[]): SprintTimesMetrics {
  return {
    weeks: [
      { label: "Semana 1", dateRangeLabel: "15 jun – 19 jun", workingDaysCount: 5 },
      { label: "Semana 2", dateRangeLabel: "22 jun – 25 jun", workingDaysCount: 4 },
    ],
    rows,
  };
}

describe("parseSprintTimesWeekSelection", () => {
  it("devuelve el índice cuando está en rango", () => {
    expect(parseSprintTimesWeekSelection("1", 2)).toBe(1);
  });

  it("devuelve 'all' con valores fuera de rango o no numéricos", () => {
    expect(parseSprintTimesWeekSelection("all", 2)).toBe(SPRINT_TIMES_WEEK_ALL);
    expect(parseSprintTimesWeekSelection("5", 2)).toBe(SPRINT_TIMES_WEEK_ALL);
    expect(parseSprintTimesWeekSelection("-1", 2)).toBe(SPRINT_TIMES_WEEK_ALL);
  });
});

describe("resolveWeekExpectedHours", () => {
  it("usa las horas esperadas exactas de la semana cuando existen", () => {
    const times = makeTimes([makeRow()]);
    expect(resolveWeekExpectedHours(makeRow(), 1, times.weeks)).toBe(32);
  });

  it("prorratea por días hábiles cuando el row no trae expectedHoursByWeek", () => {
    const times = makeTimes([makeRow()]);
    const row = makeRow({ expectedHours: 72, expectedHoursByWeek: [] });
    expect(resolveWeekExpectedHours(row, 0, times.weeks)).toBe(40);
    expect(resolveWeekExpectedHours(row, 1, times.weeks)).toBe(32);
  });
});

describe("filterSprintTimesByWeek", () => {
  it("con 'all' devuelve las métricas intactas", () => {
    const times = makeTimes([makeRow()]);
    expect(filterSprintTimesByWeek(times, SPRINT_TIMES_WEEK_ALL)).toBe(times);
  });

  it("restringe a la semana y recalcula esperadas y cumplimiento", () => {
    const times = makeTimes([makeRow()]);
    const filtered = filterSprintTimesByWeek(times, 0);

    expect(filtered.weeks).toHaveLength(1);
    expect(filtered.weeks[0]?.label).toBe("Semana 1");

    const row = filtered.rows[0]!;
    expect(row.weeks).toEqual([{ taskHours: 30, bugHours: 5, newsHours: 0 }]);
    expect(row.sprint).toEqual({ taskHours: 30, bugHours: 5, newsHours: 0 });
    expect(row.expectedHours).toBe(40);
    expect(row.compliancePct).toBe(87.5);
    expect(row.semaforo).toBe("amarillo");
  });

  it("sin horas esperadas en la semana deja el cumplimiento sin calcular", () => {
    const row = makeRow({ expectedHours: 0, expectedHoursByWeek: [0, 0] });
    const filtered = filterSprintTimesByWeek(makeTimes([row]), 1);

    expect(filtered.rows[0]?.compliancePct).toBeNull();
    expect(filtered.rows[0]?.semaforo).toBeNull();
  });

  it("con un índice inexistente devuelve las métricas intactas", () => {
    const times = makeTimes([makeRow()]);
    expect(filterSprintTimesByWeek(times, 9)).toBe(times);
  });
});
