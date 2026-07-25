import { describe, expect, it } from "vitest";

import { loadHolidayDateKeysInRange } from "@/lib/hours/load-working-day-keys";
import { buildDashboardMetrics } from "@/lib/dashboard/build-dashboard-metrics";
import type { AdoCatalogSnapshot, DashboardSprintBundle } from "@/lib/ado/types";

/**
 * Caso reportado por el equipo (jul-2026): el dashboard muestra "5 días
 * laborables" para la semana 20-jul → 24-jul cuando debería decir 4, porque
 * el 20-jul es festivo (Día de la Independencia).
 *
 * Este test verifica el flujo end-to-end: el central service entrega los
 * festivos correctos para el rango del sprint activo y `buildDashboardMetrics`
 * los aplica al calcular la serie de semanas.
 */

const SPRINT_CURR: AdoCatalogSnapshot = {
  project: "Proyecto A",
  team: "Backend",
  sprintPath: "Proyecto A/Sprint 12",
  defaultProject: "Proyecto A",
  defaultTeam: "Backend",
  suggestedTeam: null,
  sprints: [
    {
      id: "sprint-11",
      path: "Proyecto A/Sprint 11",
      name: "Sprint 11",
      startDate: "2026-07-13",
      finishDate: "2026-07-17",
    },
    {
      id: "sprint-12",
      path: "Proyecto A/Sprint 12",
      name: "Sprint 12",
      startDate: "2026-07-20",
      finishDate: "2026-07-24",
    },
  ],
  projects: [],
  teams: [],
  teamsByProject: {},
  errors: { projects: null, sprints: null, teams: null },
};

function bundle(nonWorkingDates: readonly string[]): DashboardSprintBundle {
  return {
    workItems: [],
    bugs: [],
    tasks: [],
    backlogStates: [],
    nonWorkingDates: [...nonWorkingDates],
    userAssignmentSegments: [],
    error: null,
  };
}

describe("dashboard sprint con festivo 2026-07-20", () => {
  it("loadHolidayDateKeysInRange devuelve el festivo para el rango del sprint actual", async () => {
    const dates = await loadHolidayDateKeysInRange("2026-07-20", "2026-07-24");
    expect(dates).toContain("2026-07-20");
  });

  it("buildDashboardMetrics aplica el festivo: sprint 12 → 4 laborables, no 5", async () => {
    const nonWorkingDates = await loadHolidayDateKeysInRange(
      "2026-07-20",
      "2026-07-24",
    );

    const result = buildDashboardMetrics({
      bundle: bundle(nonWorkingDates),
      catalog: SPRINT_CURR,
      selectedSprintDayKey: "",
    });

    // 4 días laborables: mar 21, mié 22, jue 23, vie 24.
    // El lun 20 queda fuera por festivo.
    expect(result.metrics.sprintWorkingDaysCount).toBe(4);
    // La serie por día debe tener 5 puntos (incluye el festivo 20-jul como
    // isHoliday:true, NO cuentan en workingDaysCount).
    expect(result.metrics.hoursByDay).toHaveLength(5);
    const jul20 = result.metrics.hoursByDay.find((p) => p.dayKey === "2026-07-20");
    expect(jul20?.isHoliday).toBe(true);
    expect(jul20?.totalHours).toBe(0);
  });

  it("buildDashboardMetrics sin festivos: sprint 12 → 5 laborables (caso de regresión)", () => {
    // Este test documenta el comportamiento cuando holidays están vacíos:
    // si el caller no pasa el festivo, el sprint tiene 5 laborables. Si
    // esto falla en producción, el caller está dejando de cargar holidays.
    const result = buildDashboardMetrics({
      bundle: bundle([]),
      catalog: SPRINT_CURR,
      selectedSprintDayKey: "",
    });

    expect(result.metrics.sprintWorkingDaysCount).toBe(5);
  });

  it("buildDashboardMetrics sprint anterior (13-17 jul): Virgen de Chiquinquirá → 4 laborables", async () => {
    const SPRINT_PREV: AdoCatalogSnapshot = {
      ...SPRINT_CURR,
      sprintPath: "Proyecto A/Sprint 11",
    };
    const nonWorkingDates = await loadHolidayDateKeysInRange(
      "2026-07-13",
      "2026-07-17",
    );
    // 13-jul es también festivo: Virgen de Chiquinquirá. El sprint anterior
    // tiene entonces 4 laborables (mar 14, mié 15, jue 16, vie 17).
    expect(nonWorkingDates).toContain("2026-07-13");
    expect(nonWorkingDates).not.toContain("2026-07-20");

    const result = buildDashboardMetrics({
      bundle: bundle(nonWorkingDates),
      catalog: SPRINT_PREV,
      selectedSprintDayKey: "",
    });

    expect(result.metrics.sprintWorkingDaysCount).toBe(4);
  });
});