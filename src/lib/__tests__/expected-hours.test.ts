import { describe, expect, it } from "vitest";

import { listWorkingDayKeysBetween } from "@/lib/working-days";
import {
  computeExpectedHours,
  DEFAULT_SPRINT_HOURS_TARGET,
  expectedHoursForDay,
  resolveAssignmentPct,
  resolveSprintHoursTarget,
  type AssignmentSegment,
} from "@/lib/expected-hours";

const fullWeek = [
  "2026-06-01",
  "2026-06-02",
  "2026-06-03",
  "2026-06-04",
  "2026-06-05",
];

const fourDayWeek = [
  "2026-06-01",
  "2026-06-02",
  "2026-06-03",
  "2026-06-04",
];

describe("computeExpectedHours", () => {
  it("5 días hábiles con 100% → 40h", () => {
    const result = computeExpectedHours(fullWeek, [
      { pct: 100, from: "2026-06-01", to: null },
    ]);
    expect(result.workingDays).toBe(5);
    expect(result.expectedHours).toBe(40);
    expect(result.weightedPct).toBe(100);
  });

  it("5 días hábiles con 50% → 20h", () => {
    const result = computeExpectedHours(fullWeek, [
      { pct: 50, from: "2026-06-01", to: null },
    ]);
    expect(result.expectedHours).toBe(20);
    expect(result.weightedPct).toBe(50);
  });

  it("semana de 4 días con 100% → 32h (caso real)", () => {
    const result = computeExpectedHours(fourDayWeek, [
      { pct: 100, from: "2026-06-01", to: null },
    ]);
    expect(result.expectedHours).toBe(32);
  });

  it("semana de 4 días con 50% → 16h", () => {
    const result = computeExpectedHours(fourDayWeek, [
      { pct: 50, from: "2026-06-01", to: null },
    ]);
    expect(result.expectedHours).toBe(16);
  });

  it("sprint de 10 días con 50% → 40h (caso del usuario)", () => {
    const sprint = [
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
      "2026-06-04",
      "2026-06-05",
      "2026-06-08",
      "2026-06-09",
      "2026-06-10",
      "2026-06-11",
      "2026-06-12",
    ];
    const result = computeExpectedHours(sprint, [
      { pct: 50, from: "2026-06-01", to: null },
    ]);
    expect(result.expectedHours).toBe(40);
  });

  it("cambio de asignación dentro del periodo: tramos separados", () => {
    const week = fullWeek;
    const segments: AssignmentSegment[] = [
      { pct: 50, from: "2026-06-01", to: "2026-06-03" },
      { pct: 100, from: "2026-06-04", to: null },
    ];
    const result = computeExpectedHours(week, segments);
    expect(result.expectedHours).toBe(4 + 4 + 4 + 8 + 8);
    expect(result.weightedPct).toBe(70);
  });

  it("sin tramos → 0h, weightedPct 0", () => {
    const result = computeExpectedHours(fullWeek, []);
    expect(result.expectedHours).toBe(0);
    expect(result.weightedPct).toBe(0);
    expect(result.workingDays).toBe(5);
  });

  it("sin días hábiles → todo 0", () => {
    const result = computeExpectedHours([], [
      { pct: 100, from: "2026-06-01", to: null },
    ]);
    expect(result).toEqual({ workingDays: 0, expectedHours: 0, weightedPct: 0 });
  });

  it("tramo que no cubre la fecha → cae al siguiente o a 0", () => {
    const segments: AssignmentSegment[] = [
      { pct: 100, from: "2026-06-10", to: "2026-06-12" },
    ];
    const result = computeExpectedHours(fullWeek, segments);
    expect(result.expectedHours).toBe(0);
  });
});

describe("resolveAssignmentPct", () => {
  const day = "2026-06-02";

  it("sin tramos → 100 por defecto (regla D17/D18)", () => {
    expect(resolveAssignmentPct(day, [])).toBe(100);
  });

  it("devuelve el pct del único tramo vigente", () => {
    expect(
      resolveAssignmentPct(day, [{ pct: 50, from: "2026-06-01", to: null }]),
    ).toBe(50);
  });

  it("devuelve el pct del último tramo cuando hay varios", () => {
    const segments: AssignmentSegment[] = [
      { pct: 50, from: "2026-05-01", to: "2026-05-31" },
      { pct: 75, from: "2026-06-01", to: null },
    ];
    expect(resolveAssignmentPct(day, segments)).toBe(75);
  });
});

describe("expectedHoursForDay", () => {
  const day = "2026-06-02";

  it("100% → 8h", () => {
    expect(
      expectedHoursForDay(day, [{ pct: 100, from: "2026-06-01", to: null }]),
    ).toBe(8);
  });

  it("75% → 6h", () => {
    expect(
      expectedHoursForDay(day, [{ pct: 75, from: "2026-06-01", to: null }]),
    ).toBe(6);
  });

  it("50% → 4h", () => {
    expect(
      expectedHoursForDay(day, [{ pct: 50, from: "2026-06-01", to: null }]),
    ).toBe(4);
  });

  it("sin tramos → 8h (100% por defecto)", () => {
    expect(expectedHoursForDay(day, [])).toBe(8);
  });
});

describe("resolveSprintHoursTarget", () => {
  it("sin días hábiles → fallback (40)", () => {
    expect(resolveSprintHoursTarget([], [{ pct: 100, from: "2026-01-01", to: null }])).toBe(
      DEFAULT_SPRINT_HOURS_TARGET,
    );
    expect(resolveSprintHoursTarget([], [], 32)).toBe(32);
  });

  it("5 días hábiles al 100% → 40h", () => {
    const target = resolveSprintHoursTarget(
      [
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
      ],
      [{ pct: 100, from: "2026-06-01", to: null }],
    );
    expect(target).toBe(40);
  });

  it("3 días hábiles al 100% → 24h (sprint corto, sin festivos)", () => {
    const target = resolveSprintHoursTarget(
      ["2026-06-01", "2026-06-02", "2026-06-03"],
      [{ pct: 100, from: "2026-06-01", to: null }],
    );
    expect(target).toBe(24);
  });

  it("5 días hábiles al 50% → 20h", () => {
    const target = resolveSprintHoursTarget(
      [
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
      ],
      [{ pct: 50, from: "2026-06-01", to: null }],
    );
    expect(target).toBe(20);
  });

  /**
   * Caso del bug reportado por el equipo (jul-2026): un sprint que cruza
   * el Día de la Independencia debe reducir el target proporcionalmente.
   * Sprint lun 20-jul → vie 24-jul: 20-jul es festivo → 4 hábiles × 8h × 100%
   * = 32h, NO 40h.
   */
  it("sprint que cruza 2026-07-20 (festivo): target se reduce del calendario", () => {
    const workingDays = listWorkingDayKeysBetween("2026-07-20", "2026-07-24", {
      nonWorkingDates: new Set(["2026-07-20"]),
    });
    expect(workingDays).toEqual([
      "2026-07-21",
      "2026-07-22",
      "2026-07-23",
      "2026-07-24",
    ]);
    expect(
      resolveSprintHoursTarget(workingDays, [
        { pct: 100, from: "2026-07-20", to: null },
      ]),
    ).toBe(32);
  });

  /**
   * Misma ventana SIN marcar el festivo: 5 días hábiles → 40h. Esto
   * documenta que el helper respeta lo que le pasan: si el caller omite el
   * festivo, el target asume 5 hábiles. La centralización del calendario
   * es responsabilidad del caller (central service de holidays).
   */
  it("mismo rango sin marcar festivo: target = 40h (depende del caller)", () => {
    const workingDays = listWorkingDayKeysBetween("2026-07-20", "2026-07-24");
    expect(workingDays).toHaveLength(5);
    expect(
      resolveSprintHoursTarget(workingDays, [
        { pct: 100, from: "2026-07-20", to: null },
      ]),
    ).toBe(40);
  });
});