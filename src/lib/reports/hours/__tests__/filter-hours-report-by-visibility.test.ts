import { describe, expect, it } from "vitest";

import { filterHoursReportByVisibility } from "@/lib/reports/hours/filter-hours-report-by-visibility";
import type {
  HoursReportResult,
  HoursReportRow,
} from "@/lib/reports/hours/hours-report-types";

function makeRow(personDisplayName: string): HoursReportRow {
  return {
    projectId: "Proyecto A",
    projectName: "Proyecto A",
    teamId: "Backend",
    teamName: "Backend",
    personDisplayName,
    assignmentPct: { kind: "default" },
    workingDays: 5,
    expectedHours: 40,
    developmentHours: 30,
    bugHours: 5,
    workedHours: 35,
    newsHours: 0,
    totalHours: 35,
    newsCount: 0,
    newsDays: 0,
    newsDetail: "",
    newsDetails: [],
    compliancePct: 87.5,
    semaforo: "amarillo",
    deviationPct: 12.5,
    deviationLevel: "amarillo",
  };
}

function buildResult(): HoursReportResult {
  return {
    rows: [makeRow("Ana"), makeRow("Beto"), makeRow("Cami")],
    generatedAt: "2026-07-12T00:00:00.000Z",
    alerts: [{ kind: "news_not_configured", message: "alerta" }],
  };
}

describe("filterHoursReportByVisibility", () => {
  it("devuelve la misma referencia cuando no hay ocultos", () => {
    const result = buildResult();
    expect(filterHoursReportByVisibility(result, new Set())).toBe(result);
  });

  it("filtra las filas de las personas ocultas", () => {
    const filtered = filterHoursReportByVisibility(
      buildResult(),
      new Set(["Beto"]),
    );
    expect(filtered.rows.map((r) => r.personDisplayName)).toEqual([
      "Ana",
      "Cami",
    ]);
  });

  it("conserva alerts y generatedAt intactos", () => {
    const result = buildResult();
    const filtered = filterHoursReportByVisibility(result, new Set(["Ana"]));
    expect(filtered.alerts).toBe(result.alerts);
    expect(filtered.generatedAt).toBe(result.generatedAt);
  });

  it("no muta el resultado original", () => {
    const result = buildResult();
    filterHoursReportByVisibility(result, new Set(["Cami"]));
    expect(result.rows).toHaveLength(3);
  });
});
