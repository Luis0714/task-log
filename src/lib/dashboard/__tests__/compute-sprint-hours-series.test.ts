import { describe, expect, it } from "vitest";

import { computeSprintHoursSeries } from "@/lib/dashboard/sprint-hours-series";
import { formatSprintDayChartLabel } from "@/lib/dashboard/sprint-days";
import { loadHolidayDateKeysInRange } from "@/lib/hours/load-working-day-keys";
import { toLocalDateKey } from "@/lib/working-days";
import type { SprintWorkingDay } from "@/lib/dashboard/sprint-days";

function buildDay(value: string, dayIndex: number): SprintWorkingDay {
  const [y, m, d] = value.split("-").map(Number);
  return {
    value,
    dayIndex,
    date: new Date(y, m - 1, d),
  };
}

function buildCalendar(values: string[]): SprintWorkingDay[] {
  let idx = 0;
  return values.map((value) => {
    idx += 1;
    return buildDay(value, idx);
  });
}

describe("computeSprintHoursSeries", () => {
  it("emite un punto por cada día del calendario, incluidos festivos", () => {
    // lun, mar, mié, jue, vie, lun(festivo), mar, mié, jue, vie
    const days = buildCalendar([
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
      "2026-06-04",
      "2026-06-05",
      "2026-06-08", // festivo entre semana
      "2026-06-09",
      "2026-06-10",
      "2026-06-11",
      "2026-06-12",
    ]);
    const nonWorkingDates = new Set(["2026-06-08"]);

    const result = computeSprintHoursSeries(
      days,
      [],
      [],
      [{ pct: 100, from: "2026-06-01", to: null }],
      { nonWorkingDates },
    );

    expect(result).toHaveLength(10);
    const holiday = result.find((point) => point.dayKey === "2026-06-08");
    expect(holiday).toBeDefined();
    expect(holiday?.isHoliday).toBe(true);
    // El festivo conserva su fecha normal (no la palabra "Festivo").
    expect(holiday?.label).toBe(formatSprintDayChartLabel(buildDay("2026-06-08", 6)));
    expect(holiday?.label).not.toBe("Festivo");
  });

  it("los festivos no modifican cumulativeHours ni idealCumulativeHours", () => {
    // lun(2h) mar(festivo) mié(3h) → festivo repite los valores previos
    const days = buildCalendar(["2026-06-01", "2026-06-02", "2026-06-03"]);
    const tasks = [
      { loggedHours: 2, workingDate: "2026-06-01" },
      { loggedHours: 3, workingDate: "2026-06-03" },
    ];
    const nonWorkingDates = new Set(["2026-06-02"]);

    const result = computeSprintHoursSeries(
      days,
      tasks,
      [],
      [{ pct: 100, from: "2026-06-01", to: null }],
      { nonWorkingDates },
    );

    expect(result[0]).toMatchObject({
      dayKey: "2026-06-01",
      cumulativeHours: 2,
      idealCumulativeHours: 8,
      isHoliday: false,
    });
    expect(result[1]).toMatchObject({
      dayKey: "2026-06-02",
      isHoliday: true,
      cumulativeHours: 2,
      idealCumulativeHours: 8,
      totalHours: 0,
    });
    expect(result[2]).toMatchObject({
      dayKey: "2026-06-03",
      cumulativeHours: 5,
      idealCumulativeHours: 16,
      isHoliday: false,
    });
  });

  it("idealCumulativeHours avanza solo en laborables (no en festivos)", () => {
    const days = buildCalendar([
      "2026-06-01", // lun
      "2026-06-02", // mar festivo
      "2026-06-03", // mié
      "2026-06-04", // jue
    ]);
    const nonWorkingDates = new Set(["2026-06-02"]);

    const result = computeSprintHoursSeries(
      days,
      [],
      [],
      [{ pct: 50, from: "2026-06-01", to: null }],
      { nonWorkingDates },
    );

    // idealPerDay = 4h (50% de 8).
    expect(result[0]?.idealCumulativeHours).toBe(4);
    expect(result[1]?.idealCumulativeHours).toBe(4); // festivo: repite
    expect(result[2]?.idealCumulativeHours).toBe(8);
    expect(result[3]?.idealCumulativeHours).toBe(12);
  });

  it("devuelve [] si no hay días hábiles", () => {
    const days: SprintWorkingDay[] = [];
    expect(computeSprintHoursSeries(days, [], [], [])).toEqual([]);
  });

  it("preserva el orden del calendario (laborables y festivos intercalados)", () => {
    const days = buildCalendar([
      "2026-06-01",
      "2026-06-02",
      "2026-06-03",
    ]);
    const nonWorkingDates = new Set(["2026-06-02"]);
    const result = computeSprintHoursSeries(
      days,
      [],
      [],
      [{ pct: 100, from: "2026-06-01", to: null }],
      { nonWorkingDates },
    );
    expect(result.map((p) => p.dayKey)).toEqual(["2026-06-01", "2026-06-02", "2026-06-03"]);
  });

  it("construye un punto cuya fecha cae exactamente en el día actual", () => {
    const today = toLocalDateKey(new Date());
    const days = buildCalendar([today]);
    const result = computeSprintHoursSeries(
      days,
      [],
      [],
      [{ pct: 100, from: today, to: null }],
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.dayKey).toBe(today);
  });

  it("festivos consecutivos mantienen la curva plana en todos ellos", () => {
    const days = buildCalendar(["2026-06-01", "2026-06-02", "2026-06-03", "2026-06-04"]);
    const nonWorkingDates = new Set(["2026-06-02", "2026-06-03"]);
    const tasks = [{ loggedHours: 4, workingDate: "2026-06-01" }];
    const result = computeSprintHoursSeries(
      days,
      tasks,
      [],
      [{ pct: 100, from: "2026-06-01", to: null }],
      { nonWorkingDates },
    );
    expect(result[0]?.cumulativeHours).toBe(4);
    expect(result[1]?.cumulativeHours).toBe(4); // festivo: repite
    expect(result[2]?.cumulativeHours).toBe(4); // festivo: repite
    expect(result[3]?.cumulativeHours).toBe(4); // primer laborable tras festivos: 0
  });

  /**
   * Caso de negocio reportado por el equipo (jul-2026): el 2026-07-20
   * (Día de la Independencia) debe aparecer como festivo en el chart del
   * dashboard y las horas de ese día NO deben sumar. Usa el central service
   * (`loadHolidayDateKeysInRange`) en vez de un set hardcoded.
   */
  it("2026-07-20 (Independencia) del central service: no suma y se marca isHoliday", async () => {
    const nonWorkingDates = new Set(
      await loadHolidayDateKeysInRange("2026-07-13", "2026-07-31"),
    );

    const days = buildCalendar([
      "2026-07-13", // lun festivo (Virgen de Chiquinquirá)
      "2026-07-14",
      "2026-07-15",
      "2026-07-16",
      "2026-07-17",
      "2026-07-20", // lun festivo (Independencia)
      "2026-07-21",
      "2026-07-22",
      "2026-07-23",
      "2026-07-24",
    ]);

    const tasks = [
      { loggedHours: 2, workingDate: "2026-07-14" },
      { loggedHours: 8, workingDate: "2026-07-20" }, // festivo → no cuenta
      { loggedHours: 3, workingDate: "2026-07-21" },
    ];

    const result = computeSprintHoursSeries(
      days,
      tasks,
      [],
      [{ pct: 100, from: "2026-07-13", to: null }],
      { nonWorkingDates },
    );

    // El festivo 2026-07-20 está marcado como tal.
    const july20 = result.find((p) => p.dayKey === "2026-07-20");
    expect(july20?.isHoliday).toBe(true);
    expect(july20?.totalHours).toBe(0);
    // La curva no avanza en el festivo (repite 2h de la última hábil 14-jul).
    expect(july20?.cumulativeHours).toBe(2);
    // El 21 (lun siguiente) sigue siendo hábil y suma sus 3h.
    const july21 = result.find((p) => p.dayKey === "2026-07-21");
    expect(july21?.isHoliday).toBe(false);
    expect(july21?.totalHours).toBe(3);
    expect(july21?.cumulativeHours).toBe(5);
  });
});
