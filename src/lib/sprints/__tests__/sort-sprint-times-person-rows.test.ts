import { describe, expect, it } from "vitest";

import {
  compareSprintTimesPersonRowsByCompliance,
  compareSprintTimesPersonRowsFull,
  sortSprintTimesPersonRows,
} from "@/lib/sprints/sort-sprint-times-person-rows";
import { SPRINT_BUG_UNASSIGNED_LABEL } from "@/lib/sprints/filter-sprint-bug-detail-items";
import type { SprintTimesPersonRow } from "@/lib/sprints/sprint-stats-types";

function makeRow(
  overrides: Partial<SprintTimesPersonRow> = {},
): SprintTimesPersonRow {
  return {
    assignee: overrides.assignee ?? "Ana",
    weeks: overrides.weeks ?? [],
    sprint: overrides.sprint ?? { taskHours: 0, bugHours: 0, newsHours: 0 },
    expectedHours: overrides.expectedHours ?? 0,
    expectedHoursByWeek: overrides.expectedHoursByWeek ?? [],
    compliancePct: overrides.compliancePct ?? null,
    semaforo: overrides.semaforo ?? null,
  };
}

describe("compareSprintTimesPersonRowsByCompliance", () => {
  it("ordena descendente y empuja nulos al final", () => {
    const high = makeRow({ compliancePct: 90 });
    const low = makeRow({ compliancePct: 30 });
    const none = makeRow({ compliancePct: null });

    expect(compareSprintTimesPersonRowsByCompliance(high, low)).toBeLessThan(0);
    expect(compareSprintTimesPersonRowsByCompliance(low, high)).toBeGreaterThan(0);
    expect(compareSprintTimesPersonRowsByCompliance(none, low)).toBeGreaterThan(0);
    expect(compareSprintTimesPersonRowsByCompliance(low, none)).toBeLessThan(0);
    expect(compareSprintTimesPersonRowsByCompliance(none, none)).toBe(0);
  });
});

describe("sortSprintTimesPersonRows", () => {
  it("no muta el arreglo original", () => {
    const original = [
      makeRow({ assignee: "Beto", compliancePct: 50 }),
      makeRow({ assignee: "Ana", compliancePct: 90 }),
    ];
    const snapshot = [...original];

    sortSprintTimesPersonRows(original);

    expect(original).toEqual(snapshot);
  });

  it("ordena por cumplimiento descendente y luego alfabético como desempate", () => {
    const sorted = sortSprintTimesPersonRows([
      makeRow({ assignee: "Beto", compliancePct: 50 }),
      makeRow({ assignee: "Ana", compliancePct: 50 }),
      makeRow({ assignee: "Cami", compliancePct: 80 }),
    ]);

    expect(sorted.map((row) => row.assignee)).toEqual(["Cami", "Ana", "Beto"]);
  });

  it("usa el total de horas del sprint como desempate del cumplimiento", () => {
    const sorted = sortSprintTimesPersonRows([
      makeRow({
        assignee: "Poco",
        compliancePct: 50,
        sprint: { taskHours: 1, bugHours: 0, newsHours: 0 },
      }),
      makeRow({
        assignee: "Mucho",
        compliancePct: 50,
        sprint: { taskHours: 10, bugHours: 0, newsHours: 0 },
      }),
    ]);

    expect(sorted.map((row) => row.assignee)).toEqual(["Mucho", "Poco"]);
  });

  it("empuja 'Sin asignar' al final cuando hay empate de cumplimiento y horas", () => {
    // Mismo cumplimiento y mismas horas → la regla "Sin asignar" al final
    // decide el desempate.
    const sorted = sortSprintTimesPersonRows([
      makeRow({
        assignee: SPRINT_BUG_UNASSIGNED_LABEL,
        compliancePct: 80,
        sprint: { taskHours: 40, bugHours: 0, newsHours: 0 },
        expectedHours: 50,
      }),
      makeRow({
        assignee: "Ana",
        compliancePct: 80,
        sprint: { taskHours: 40, bugHours: 0, newsHours: 0 },
        expectedHours: 50,
      }),
    ]);

    expect(sorted.map((row) => row.assignee)).toEqual([
      "Ana",
      SPRINT_BUG_UNASSIGNED_LABEL,
    ]);
  });

  it("coloca los nulos al final respetando el orden alfabético entre ellos", () => {
    const sorted = sortSprintTimesPersonRows([
      makeRow({ assignee: "Cami", compliancePct: null }),
      makeRow({ assignee: "Ana", compliancePct: 80 }),
      makeRow({ assignee: "Beto", compliancePct: null }),
    ]);

    expect(sorted.map((row) => row.assignee)).toEqual(["Ana", "Beto", "Cami"]);
  });
});

describe("compareSprintTimesPersonRowsFull", () => {
  it("produce el mismo orden que sortSprintTimesPersonRows", () => {
    const rows = [
      makeRow({ assignee: "Beto", compliancePct: 50 }),
      makeRow({ assignee: "Ana", compliancePct: 90 }),
      makeRow({ assignee: "Cami", compliancePct: null }),
    ];

    const expected = sortSprintTimesPersonRows(rows).map((row) => row.assignee);
    const actual = [...rows]
      .sort(compareSprintTimesPersonRowsFull)
      .map((row) => row.assignee);

    expect(actual).toEqual(expected);
  });
});
