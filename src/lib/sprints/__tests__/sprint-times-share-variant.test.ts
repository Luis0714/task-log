import { describe, expect, it } from "vitest";

import { canShareSprintTimes, isSprintTimesShareVariantEnabled, resolveSprintTimesShareVariant } from "@/lib/sprints/sprint-times-share-eligibility";
import {
  buildSprintTimesShareVariantItems,
  buildSprintTimesShareWeekVariant,
  getSprintTimesShareVariantLabel,
  getSprintTimesShareWeekDateRange,
  isFullSprintTimesShareVariant,
  isSprintTimesShareVariantSelected,
  parseSprintTimesShareWeekIndex,
  type SprintTimesShareVariant,
} from "@/lib/sprints/sprint-times-share-variant";
import type { SprintTimesMetrics } from "@/lib/sprints/sprint-stats-types";

function buildTimes(weekCount: number): SprintTimesMetrics {
  return {
    weeks: Array.from({ length: weekCount }, (_, index) => ({
      label: `Semana ${index + 1}`,
      dateRangeLabel: "",
      workingDaysCount: 5,
    })),
    rows: [
      {
        assignee: "A",
        weeks: [],
        sprint: { taskHours: 0, bugHours: 0, newsHours: 0 },
        expectedHours: 0,
        compliancePct: null,
        semaforo: null,
      },
    ],
  };
}

function buildTimesWithLabels(): SprintTimesMetrics {
  return {
    weeks: [
      { label: "Semana 1", dateRangeLabel: "01 ago – 07 ago", workingDaysCount: 5 },
      { label: "Semana 2", dateRangeLabel: "08 ago – 14 ago", workingDaysCount: 5 },
      { label: "Semana 3", dateRangeLabel: "15 ago – 21 ago", workingDaysCount: 5 },
    ],
    rows: [
      {
        assignee: "A",
        weeks: [],
        sprint: { taskHours: 0, bugHours: 0, newsHours: 0 },
        expectedHours: 0,
        compliancePct: null,
        semaforo: null,
      },
    ],
  };
}

describe("isFullSprintTimesShareVariant", () => {
  it("reconoce solo la variante completa", () => {
    expect(isFullSprintTimesShareVariant("full")).toBe(true);
    expect(isFullSprintTimesShareVariant(buildSprintTimesShareWeekVariant(1))).toBe(false);
  });
});

describe("parseSprintTimesShareWeekIndex", () => {
  it("devuelve el índice 1-based", () => {
    expect(parseSprintTimesShareWeekIndex(buildSprintTimesShareWeekVariant(1))).toBe(1);
    expect(parseSprintTimesShareWeekIndex(buildSprintTimesShareWeekVariant(3))).toBe(3);
  });

  it("devuelve null para la variante completa o valores inválidos", () => {
    expect(parseSprintTimesShareWeekIndex("full")).toBeNull();
    expect(parseSprintTimesShareWeekIndex("weekx" as SprintTimesShareVariant)).toBeNull();
  });
});

describe("buildSprintTimesShareVariantItems", () => {
  it("incluye Completo + una opción por cada semana del sprint", () => {
    const times = buildTimes(3);
    const items = buildSprintTimesShareVariantItems(times);
    expect(items.map((item) => item.value)).toEqual([
      "full",
      buildSprintTimesShareWeekVariant(1),
      buildSprintTimesShareWeekVariant(2),
      buildSprintTimesShareWeekVariant(3),
    ]);
    expect(items.map((item) => item.label)).toEqual([
      "Completo",
      "Semana 1",
      "Semana 2",
      "Semana 3",
    ]);
  });

  it("respeta la etiqueta que trae cada semana", () => {
    const times: SprintTimesMetrics = {
      weeks: [{ label: "Semana parcial", dateRangeLabel: "01 – 03", workingDaysCount: 3 }],
      rows: [],
    };
    const items = buildSprintTimesShareVariantItems(times);
    expect(items[1]?.label).toBe("Semana parcial");
  });
});

describe("isSprintTimesShareVariantEnabled", () => {
  it("habilita full y todas las semanas que existen en el sprint", () => {
    const times = buildTimes(3);
    expect(isSprintTimesShareVariantEnabled(times, "full")).toBe(true);
    expect(isSprintTimesShareVariantEnabled(times, buildSprintTimesShareWeekVariant(3))).toBe(true);
  });

  it("deshabilita variantes de semana que exceden el total", () => {
    const times = buildTimes(2);
    expect(isSprintTimesShareVariantEnabled(times, buildSprintTimesShareWeekVariant(3))).toBe(false);
  });
});

describe("canShareSprintTimes", () => {
  it("devuelve false cuando no hay semanas o no hay filas", () => {
    expect(canShareSprintTimes({ weeks: [], rows: [] })).toBe(false);
    expect(
      canShareSprintTimes({
        weeks: [{ label: "S1", dateRangeLabel: "", workingDaysCount: 1 }],
        rows: [],
      }),
    ).toBe(false);
  });
});

describe("resolveSprintTimesShareVariant", () => {
  it("cae a full cuando la variante seleccionada no está disponible", () => {
    const times = buildTimes(1);
    expect(resolveSprintTimesShareVariant(times, buildSprintTimesShareWeekVariant(5))).toBe("full");
  });

  it("conserva la variante si está disponible", () => {
    const times = buildTimes(3);
    expect(resolveSprintTimesShareVariant(times, buildSprintTimesShareWeekVariant(2))).toBe(
      buildSprintTimesShareWeekVariant(2),
    );
  });
});

describe("getSprintTimesShareVariantLabel", () => {
  it("devuelve la etiqueta humana correspondiente", () => {
    const times = buildTimes(2);
    expect(getSprintTimesShareVariantLabel("full", times)).toBe("Completo");
    expect(getSprintTimesShareVariantLabel(buildSprintTimesShareWeekVariant(2), times)).toBe("Semana 2");
  });
});

describe("isSprintTimesShareVariantSelected", () => {
  it("distingue selección nula de variante válida", () => {
    expect(isSprintTimesShareVariantSelected(null)).toBe(false);
    expect(isSprintTimesShareVariantSelected("full")).toBe(true);
    expect(isSprintTimesShareVariantSelected(buildSprintTimesShareWeekVariant(1))).toBe(true);
  });
});

describe("getSprintTimesShareWeekDateRange", () => {
  it("devuelve el rango de la semana cuando la variante es una semana específica", () => {
    const times = buildTimesWithLabels();
    expect(getSprintTimesShareWeekDateRange(times, buildSprintTimesShareWeekVariant(2))).toBe(
      "08 ago – 14 ago",
    );
  });

  it("devuelve null para la variante completa (debe usarse el rango del sprint)", () => {
    const times = buildTimesWithLabels();
    expect(getSprintTimesShareWeekDateRange(times, "full")).toBeNull();
  });
});
