import { describe, expect, it } from "vitest";

import { uniquePersonDisplayNames } from "@/lib/reports/hours/unique-person-display-names";
import type { HoursReportRow } from "@/lib/reports/hours/hours-report-types";

function makeRow(personDisplayName: string): HoursReportRow {
  return {
    projectId: "P",
    projectName: "P",
    teamId: null,
    teamName: null,
    personDisplayName,
    assignmentPct: { kind: "default" },
    workingDays: 1,
    expectedHours: 8,
    developmentHours: 0,
    bugHours: 0,
    newsHours: 0,
    totalHours: 0,
    newsCount: 0,
    newsDays: 0,
    newsDetail: "",
    newsDetails: [],
    compliancePct: null,
    semaforo: null,
  };
}

describe("uniquePersonDisplayNames", () => {
  it("devuelve [] cuando no hay filas", () => {
    expect(uniquePersonDisplayNames([])).toEqual([]);
  });

  it("deduplica nombres repetidos en distintas filas", () => {
    const rows = [
      makeRow("Ana"),
      makeRow("Beto"),
      makeRow("Ana"),
      makeRow("Cami"),
      makeRow("Beto"),
    ];
    expect(uniquePersonDisplayNames(rows)).toEqual(["Ana", "Beto", "Cami"]);
  });

  it("ordena alfabéticamente en español", () => {
    const rows = [
      makeRow("Zoe"),
      makeRow("ana"),
      makeRow("Beto"),
      makeRow("Álex"),
    ];
    expect(uniquePersonDisplayNames(rows)).toEqual([
      "Álex",
      "ana",
      "Beto",
      "Zoe",
    ]);
  });
});