import { describe, expect, it } from "vitest";

import {
  filterAssignmentRows,
  filterByPersonName,
} from "@/lib/assignments/filter-assignments";

type Row = {
  personDisplayName: string;
  projectName: string;
  teamName: string | null;
};

const rows: Row[] = [
  { personDisplayName: "José Pérez", projectName: "Alpha", teamName: "Web" },
  { personDisplayName: "María Gómez", projectName: "Alpha", teamName: "API" },
  { personDisplayName: "Ana Ruiz", projectName: "Beta", teamName: null },
];

describe("filterByPersonName", () => {
  it("ignora mayúsculas y diacríticos", () => {
    expect(filterByPersonName(rows, "jose").map((r) => r.personDisplayName)).toEqual([
      "José Pérez",
    ]);
    expect(filterByPersonName(rows, "MARIA").map((r) => r.personDisplayName)).toEqual([
      "María Gómez",
    ]);
  });

  it("devuelve todo (copia) cuando la búsqueda está vacía", () => {
    const result = filterByPersonName(rows, "  ");
    expect(result).toHaveLength(3);
    expect(result).not.toBe(rows);
  });
});

describe("filterAssignmentRows", () => {
  it("combina búsqueda de persona, proyectos y equipos", () => {
    const result = filterAssignmentRows(rows, {
      personQuery: "",
      projects: ["Alpha"],
      teams: ["Web"],
    });
    expect(result.map((r) => r.personDisplayName)).toEqual(["José Pérez"]);
  });

  it("sin proyectos/equipos seleccionados no filtra por slot", () => {
    const result = filterAssignmentRows(rows, {
      personQuery: "ana",
      projects: [],
      teams: [],
    });
    expect(result.map((r) => r.personDisplayName)).toEqual(["Ana Ruiz"]);
  });

  it("las filas a nivel de proyecto (sin equipo) pasan el filtro de equipos", () => {
    const result = filterAssignmentRows(rows, {
      personQuery: "",
      projects: [],
      teams: ["Web", "API"],
    });
    expect(result.map((r) => r.teamName)).toEqual(["Web", "API", null]);
  });

  it("excluye filas cuyo equipo no está en la selección", () => {
    const result = filterAssignmentRows(rows, {
      personQuery: "",
      projects: [],
      teams: ["Web"],
    });
    expect(result.map((r) => r.teamName)).toEqual(["Web", null]);
  });
});
