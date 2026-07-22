import { describe, expect, it } from "vitest";

import { buildSprintTimesSharePayload } from "@/lib/sprints/build-sprint-times-share-payload";
import type { SprintTimesShareContext } from "@/lib/sprints/sprint-times-share-types";
import type { SprintTimesMetrics } from "@/lib/sprints/sprint-stats-types";

function buildTimes(): SprintTimesMetrics {
  return {
    weeks: [
      { label: "Semana 1", dateRangeLabel: "01 – 07", workingDaysCount: 5 },
    ],
    rows: [
      {
        assignee: "Ana",
        weeks: [{ taskHours: 1, bugHours: 0, newsHours: 0 }],
        sprint: { taskHours: 1, bugHours: 0, newsHours: 0 },
        expectedHours: 0,
        expectedHoursByWeek: [],
        compliancePct: null,
        semaforo: null,
      },
      {
        assignee: "Beto",
        weeks: [{ taskHours: 2, bugHours: 1, newsHours: 0 }],
        sprint: { taskHours: 2, bugHours: 1, newsHours: 0 },
        expectedHours: 0,
        expectedHoursByWeek: [],
        compliancePct: null,
        semaforo: null,
      },
      {
        assignee: "Cami",
        weeks: [{ taskHours: 3, bugHours: 0, newsHours: 0 }],
        sprint: { taskHours: 3, bugHours: 0, newsHours: 0 },
        expectedHours: 0,
        expectedHoursByWeek: [],
        compliancePct: null,
        semaforo: null,
      },
    ],
  };
}

function buildContext(
  overrides: Partial<SprintTimesShareContext> = {},
): SprintTimesShareContext {
  return {
    projectName: "Proyecto",
    teamName: "Equipo",
    sprintName: "Sprint",
    goalOnly: false,
    dataSourceLabel: "live",
    variant: "full",
    hiddenAssignees: [],
    ...overrides,
  };
}

describe("buildSprintTimesSharePayload", () => {
  it("incluye todas las filas cuando hiddenAssignees está vacío", () => {
    const payload = buildSprintTimesSharePayload(buildTimes(), buildContext());
    expect(payload.table.rows.map((r) => r.assignee)).toEqual(["Ana", "Beto", "Cami"]);
  });

  it("excluye las filas cuyos assignees están en hiddenAssignees", () => {
    const payload = buildSprintTimesSharePayload(
      buildTimes(),
      buildContext({ hiddenAssignees: ["Ana", "Cami"] }),
    );
    expect(payload.table.rows.map((r) => r.assignee)).toEqual(["Beto"]);
  });

  it("construye el teamTotalRow a partir de las filas visibles", () => {
    const payload = buildSprintTimesSharePayload(
      buildTimes(),
      buildContext({ hiddenAssignees: ["Ana"] }),
    );
    expect(payload.table.teamTotalRow.assignee).toBe("Total equipo");
    const sprintTotal = payload.table.teamTotalRow.sprint;
    expect(sprintTotal).toEqual({ taskHours: 5, bugHours: 1, newsHours: 0 });
  });

  it("en variante semana, ordena las filas por % de cumplimiento semanal (no conserva el orden del sprint)", () => {
    // Sprint completo (1 sola semana para simplificar la variante semanal):
    // Ana lidera con 60% global; Beto tiene 30%. En la semana 1 invertimos:
    // Ana registra 4h de 40 esperadas (10%); Beto registra 36h de 40 (90%).
    // El payload con variante 'week1' debe colocar a Beto primero.
    const times: SprintTimesMetrics = {
      weeks: [
        { label: "Semana 1", dateRangeLabel: "01 – 05", workingDaysCount: 5 },
      ],
      rows: [
        {
          assignee: "Ana",
          weeks: [{ taskHours: 4, bugHours: 0, newsHours: 0 }],
          sprint: { taskHours: 24, bugHours: 0, newsHours: 0 },
          expectedHours: 40,
          expectedHoursByWeek: [40],
          compliancePct: 60,
          semaforo: "verde",
        },
        {
          assignee: "Beto",
          weeks: [{ taskHours: 36, bugHours: 0, newsHours: 0 }],
          sprint: { taskHours: 12, bugHours: 0, newsHours: 0 },
          expectedHours: 40,
          expectedHoursByWeek: [40],
          compliancePct: 30,
          semaforo: "rojo",
        },
      ],
    };

    const payload = buildSprintTimesSharePayload(
      times,
      buildContext({ variant: "week1" }),
    );

    // El orden refleja el cumplimiento semanal: Beto (90%) > Ana (10%).
    expect(payload.table.rows.map((r) => r.assignee)).toEqual(["Beto", "Ana"]);
  });
});
