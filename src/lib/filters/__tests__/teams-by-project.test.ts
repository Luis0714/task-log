import { describe, expect, it } from "vitest";

import {
  pruneTeamSelection,
  teamNamesForProjects,
  teamsForProjects,
} from "@/lib/filters/teams-by-project";

const teamsByProject = {
  Alpha: [
    { id: "a2", name: "Web" },
    { id: "a1", name: "API" },
  ],
  Beta: [
    { id: "b1", name: "QA" },
    { id: "b2", name: "Web" },
  ],
  Gamma: [],
};

describe("teamsForProjects", () => {
  it("devuelve solo los equipos de los proyectos seleccionados", () => {
    expect(teamsForProjects(teamsByProject, ["Beta"])).toEqual([
      { id: "b1", name: "QA" },
      { id: "b2", name: "Web" },
    ]);
  });

  it("une los equipos de varios proyectos sin duplicar nombres y ordenados", () => {
    expect(teamNamesForProjects(teamsByProject, ["Alpha", "Beta"])).toEqual([
      "API",
      "QA",
      "Web",
    ]);
  });

  it("sin selección aplica sobre todos los proyectos", () => {
    expect(teamNamesForProjects(teamsByProject, [])).toEqual(["API", "QA", "Web"]);
  });

  it("ignora proyectos que no están en el mapa", () => {
    expect(teamsForProjects(teamsByProject, ["Delta"])).toEqual([]);
  });
});

describe("pruneTeamSelection", () => {
  it("conserva solo los equipos disponibles", () => {
    expect(pruneTeamSelection(["Web", "QA"], ["Web", "API"])).toEqual(["Web"]);
  });

  it("devuelve vacío cuando nada sigue disponible", () => {
    expect(pruneTeamSelection(["QA"], [])).toEqual([]);
  });
});
