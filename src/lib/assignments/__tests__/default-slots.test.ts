import { describe, expect, it } from "vitest";

import { buildDefaultSlots } from "@/lib/assignments/default-slots";

describe("buildDefaultSlots", () => {
  it("combina proyectos × equipos seleccionados", () => {
    expect(buildDefaultSlots(["Alpha"], ["Web", "API"], [], [])).toEqual([
      { projectLabel: "Alpha", teamName: "Web" },
      { projectLabel: "Alpha", teamName: "API" },
    ]);
  });

  it("cae a los proyectos/equipos del catálogo cuando no hay selección", () => {
    expect(buildDefaultSlots([], [], ["Alpha"], ["Web"])).toEqual([
      { projectLabel: "Alpha", teamName: "Web" },
    ]);
  });

  it("devuelve [] si no hay proyectos ni fallback", () => {
    expect(buildDefaultSlots([], ["Web"], [], ["Web"])).toEqual([]);
  });

  it("devuelve [] si no hay equipos ni fallback", () => {
    expect(buildDefaultSlots(["Alpha"], [], ["Alpha"], [])).toEqual([]);
  });
});
