import { describe, expect, it } from "vitest";

import {
  catalogToSprintContext,
  resolveSprintDateRange,
} from "@/lib/ado/sprint-data-context";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { WORK_ITEM_ASSIGNEE_ME } from "@/lib/schemas/work-item-filters";

function makeCatalog(overrides: Partial<AdoCatalogSnapshot> = {}): AdoCatalogSnapshot {
  return {
    projects: [],
    teams: [],
    teamsByProject: {},
    sprints: [],
    defaultProject: null,
    defaultTeam: null,
    suggestedTeam: null,
    project: "Proyecto A",
    team: "Equipo A",
    sprintPath: "Proyecto A\\Sprint 42",
    errors: { projects: null, teams: null, sprints: null },
    ...overrides,
  };
}

describe("resolveSprintDateRange", () => {
  it("devuelve null si falta project, team o sprintPath", () => {
    expect(resolveSprintDateRange(makeCatalog({ project: "" }))).toBeNull();
    expect(resolveSprintDateRange(makeCatalog({ team: "" }))).toBeNull();
    expect(resolveSprintDateRange(makeCatalog({ sprintPath: "" }))).toBeNull();
  });

  it("devuelve null en fechas cuando el sprint no está en el catálogo", () => {
    const range = resolveSprintDateRange(makeCatalog());
    expect(range).toEqual({
      project: "Proyecto A",
      team: "Equipo A",
      sprintPath: "Proyecto A\\Sprint 42",
      startDate: null,
      finishDate: null,
    });
  });

  it("extrae start/finish del sprint seleccionado por path", () => {
    const catalog = makeCatalog({
      sprints: [
        { id: "1", name: "Sprint 41", path: "Proyecto A\\Sprint 41" },
        {
          id: "2",
          name: "Sprint 42",
          path: "Proyecto A\\Sprint 42",
          startDate: "2026-07-01",
          finishDate: "2026-07-14",
        },
      ],
    });

    expect(resolveSprintDateRange(catalog)).toEqual({
      project: "Proyecto A",
      team: "Equipo A",
      sprintPath: "Proyecto A\\Sprint 42",
      startDate: "2026-07-01",
      finishDate: "2026-07-14",
    });
  });

  it("NO filtra work items por sprint: solo expone el rango de fechas", () => {
    // El sprint solo aporta start/finish; la consulta de bugs/tareas
    // se hace contra `System.CreatedDate` / fecha de trabajo, nunca
    // contra `System.IterationPath`.
    const range = resolveSprintDateRange(
      makeCatalog({
        sprintPath: "Proyecto A\\Sprint 99 (no existe)",
      }),
    );
    expect(range?.startDate).toBeNull();
    expect(range?.finishDate).toBeNull();
  });
});

describe("catalogToSprintContext", () => {
  it("reusa resolveSprintDateRange y añade el assignee por defecto", () => {
    const ctx = catalogToSprintContext(makeCatalog());
    expect(ctx).toEqual({
      project: "Proyecto A",
      team: "Equipo A",
      sprintPath: "Proyecto A\\Sprint 42",
      sprintStartDate: null,
      sprintFinishDate: null,
      assignee: WORK_ITEM_ASSIGNEE_ME,
    });
  });

  it("respeta el assignee recibido y propaga las fechas del sprint", () => {
    const ctx = catalogToSprintContext(
      makeCatalog({
        sprints: [
          {
            id: "1",
            name: "Sprint 42",
            path: "Proyecto A\\Sprint 42",
            startDate: "2026-07-01",
            finishDate: "2026-07-14",
          },
        ],
      }),
      "usuario@empresa.com",
    );
    expect(ctx).toEqual({
      project: "Proyecto A",
      team: "Equipo A",
      sprintPath: "Proyecto A\\Sprint 42",
      sprintStartDate: "2026-07-01",
      sprintFinishDate: "2026-07-14",
      assignee: "usuario@empresa.com",
    });
  });
});
