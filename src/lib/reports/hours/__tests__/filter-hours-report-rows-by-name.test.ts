import { describe, expect, it } from "vitest";

import { filterHoursReportRowsByName } from "@/lib/reports/hours/filter-hours-report-rows-by-name";
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
    workedHours: 0,
    newsHours: 0,
    totalHours: 0,
    newsCount: 0,
    newsDays: 0,
    newsDetail: "",
    newsDetails: [],
    compliancePct: null,
    semaforo: null,
    deviationPct: null,
    deviationLevel: null,
  };
}

describe("filterHoursReportRowsByName", () => {
  const rows = [makeRow("Ana Pérez"), makeRow("ÁNA"), makeRow("Beto")];

  it("devuelve copia superficial cuando el filtro está vacío", () => {
    expect(filterHoursReportRowsByName(rows, "")).toEqual(rows);
    expect(filterHoursReportRowsByName(rows, "   ")).toEqual(rows);
  });

  it("ignora mayúsculas, acentos y espacios al comparar", () => {
    expect(
      filterHoursReportRowsByName(rows, "ana").map((r) => r.personDisplayName),
    ).toEqual(["Ana Pérez", "ÁNA"]);
  });

  it("matchea por substring (no solo prefijo)", () => {
    expect(
      filterHoursReportRowsByName(rows, "érez").map((r) => r.personDisplayName),
    ).toEqual(["Ana Pérez"]);
  });

  it("no muta el array original", () => {
    const original = [...rows];
    filterHoursReportRowsByName(rows, "ana");
    expect(rows).toEqual(original);
  });
});