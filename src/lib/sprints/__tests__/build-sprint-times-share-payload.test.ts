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
        compliancePct: null,
        semaforo: null,
      },
      {
        assignee: "Beto",
        weeks: [{ taskHours: 2, bugHours: 1, newsHours: 0 }],
        sprint: { taskHours: 2, bugHours: 1, newsHours: 0 },
        expectedHours: 0,
        compliancePct: null,
        semaforo: null,
      },
      {
        assignee: "Cami",
        weeks: [{ taskHours: 3, bugHours: 0, newsHours: 0 }],
        sprint: { taskHours: 3, bugHours: 0, newsHours: 0 },
        expectedHours: 0,
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
});
