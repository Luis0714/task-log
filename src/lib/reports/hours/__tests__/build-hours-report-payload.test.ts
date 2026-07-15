import { describe, expect, it } from "vitest";

import { buildHoursReportPayload } from "@/lib/reports/hours/build-hours-report-payload";

const teamsByProject: Record<string, Array<{ id: string; name: string }>> = {
  "Proyecto A": [
    { id: "t-a", name: "Backend" },
    { id: "t-b", name: "Frontend" },
  ],
  "Proyecto B": [{ id: "t-c", name: "Backend" }],
};

const allProjectNames = ["Proyecto A", "Proyecto B"];

describe("buildHoursReportPayload", () => {
  const period = { kind: "month", monthKey: "2026-07" } as const;

  it("usa los proyectos seleccionados cuando hay selección", () => {
    const payload = buildHoursReportPayload({
      period,
      projectIds: ["Proyecto A"],
      teamIds: [],
      allProjectNames,
      teamsByProject,
    });
    expect(payload.scopes.projectIds).toEqual(["Proyecto A"]);
  });

  it("usa todos los proyectos cuando la selección está vacía", () => {
    const payload = buildHoursReportPayload({
      period,
      projectIds: [],
      teamIds: [],
      allProjectNames,
      teamsByProject,
    });
    expect(payload.scopes.projectIds).toEqual(["Proyecto A", "Proyecto B"]);
  });

  it("usa los equipos seleccionados cuando hay selección", () => {
    const payload = buildHoursReportPayload({
      period,
      projectIds: ["Proyecto A"],
      teamIds: ["Frontend"],
      allProjectNames,
      teamsByProject,
    });
    expect(payload.scopes.teamIds).toEqual(["Frontend"]);
  });

  it("infiere los equipos desde los proyectos seleccionados cuando no hay selección", () => {
    const payload = buildHoursReportPayload({
      period,
      projectIds: ["Proyecto A"],
      teamIds: [],
      allProjectNames,
      teamsByProject,
    });
    expect(payload.scopes.teamIds).toEqual(["Backend", "Frontend"]);
  });

  it("infiere equipos de todos los proyectos cuando no hay proyectos ni equipos", () => {
    const payload = buildHoursReportPayload({
      period,
      projectIds: [],
      teamIds: [],
      allProjectNames,
      teamsByProject,
    });
    expect(payload.scopes.teamIds).toEqual(["Backend", "Frontend"]);
  });

  it("propaga el periodo tal cual", () => {
    const payload = buildHoursReportPayload({
      period: { kind: "range", fromIso: "2026-07-01", toIso: "2026-07-15" },
      projectIds: [],
      teamIds: [],
      allProjectNames,
      teamsByProject,
    });
    expect(payload.period).toEqual({
      kind: "range",
      fromIso: "2026-07-01",
      toIso: "2026-07-15",
    });
  });

  it("no muta los arrays de entrada", () => {
    const projectIds = ["Proyecto A"];
    const teamIds = ["Backend"];
    buildHoursReportPayload({
      period,
      projectIds,
      teamIds,
      allProjectNames,
      teamsByProject,
    });
    expect(projectIds).toEqual(["Proyecto A"]);
    expect(teamIds).toEqual(["Backend"]);
  });
});