import { describe, expect, it } from "vitest";

import { filterInferredDefaultSlots } from "@/lib/assignments/filter-inferred-default-slots";

function slot(personAdoId: string, projectId: string, teamId: string | null) {
  return { personAdoId, projectId, teamId };
}

describe("filterInferredDefaultSlots", () => {
  it("sin excepciones deja todos los slots (una fila por equipo)", () => {
    const slots = [
      slot("p1", "NARP", "Kanoa"),
      slot("p1", "NARP", "Studia"),
    ];
    expect(filterInferredDefaultSlots(slots, [])).toEqual(slots);
  });

  it("la excepción de un equipo NO suprime los defaults de los otros equipos del proyecto", () => {
    const slots = [
      slot("marco", "NARP", "Kanoa"),
      slot("marco", "NARP", "Studia"),
      slot("marco", "NARP", "NARP Team"),
    ];
    const existing = [
      slot("marco", "NARP", "Kanoa"),
      slot("marco", "NARP", "NARP Team"),
    ];

    expect(filterInferredDefaultSlots(slots, existing)).toEqual([
      slot("marco", "NARP", "Studia"),
    ]);
  });

  it("solo afecta a la persona con excepción, no a sus compañeros de equipo", () => {
    const slots = [
      slot("marco", "NARP", "Kanoa"),
      slot("jose", "NARP", "Kanoa"),
    ];
    const existing = [slot("marco", "NARP", "Kanoa")];

    expect(filterInferredDefaultSlots(slots, existing)).toEqual([
      slot("jose", "NARP", "Kanoa"),
    ]);
  });

  it("la excepción no cruza proyectos", () => {
    const slots = [slot("marco", "Beta", "Kanoa")];
    const existing = [slot("marco", "NARP", "Kanoa")];

    expect(filterInferredDefaultSlots(slots, existing)).toEqual(slots);
  });

  it("una excepción a nivel de proyecto cubre todos sus equipos", () => {
    const slots = [
      slot("marco", "NARP", "Kanoa"),
      slot("marco", "NARP", "Studia"),
    ];
    const existing = [slot("marco", "NARP", null)];

    expect(filterInferredDefaultSlots(slots, existing)).toEqual([]);
  });

  it("un slot a nivel de proyecto queda cubierto por cualquier excepción del proyecto", () => {
    const slots = [slot("marco", "NARP", null)];
    const existing = [slot("marco", "NARP", "Kanoa")];

    expect(filterInferredDefaultSlots(slots, existing)).toEqual([]);
  });
});
