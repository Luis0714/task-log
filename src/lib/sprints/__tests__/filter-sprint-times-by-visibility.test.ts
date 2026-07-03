import { describe, expect, it } from "vitest";

import { filterSprintTimesByVisibility } from "@/lib/sprints/filter-sprint-times-by-visibility";
import type { SprintTimesMetrics } from "@/lib/sprints/sprint-stats-types";

function buildTimes(): SprintTimesMetrics {
  return {
    weeks: [
      { label: "Semana 1", dateRangeLabel: "01 – 07", workingDaysCount: 5 },
    ],
    rows: [
      {
        assignee: "Ana",
        weeks: [{ taskHours: 1, bugHours: 0 }],
        sprint: { taskHours: 1, bugHours: 0 },
      },
      {
        assignee: "Beto",
        weeks: [{ taskHours: 2, bugHours: 1 }],
        sprint: { taskHours: 2, bugHours: 1 },
      },
      {
        assignee: "Cami",
        weeks: [{ taskHours: 3, bugHours: 0 }],
        sprint: { taskHours: 3, bugHours: 0 },
      },
    ],
  };
}

describe("filterSprintTimesByVisibility", () => {
  it("devuelve la misma referencia cuando no hay ocultos", () => {
    const times = buildTimes();
    const result = filterSprintTimesByVisibility(times, new Set());
    expect(result).toBe(times);
  });

  it("filtra las filas cuyos assignees están en el set", () => {
    const times = buildTimes();
    const result = filterSprintTimesByVisibility(times, new Set(["Beto"]));
    expect(result.rows.map((r) => r.assignee)).toEqual(["Ana", "Cami"]);
    expect(result.weeks).toBe(times.weeks);
  });

  it("filtra múltiples assignees y conserva la estructura", () => {
    const times = buildTimes();
    const result = filterSprintTimesByVisibility(
      times,
      new Set(["Ana", "Cami"]),
    );
    expect(result.rows.map((r) => r.assignee)).toEqual(["Beto"]);
  });

  it("no muta las filas originales", () => {
    const times = buildTimes();
    filterSprintTimesByVisibility(times, new Set(["Beto"]));
    expect(times.rows.map((r) => r.assignee)).toEqual(["Ana", "Beto", "Cami"]);
  });
});
