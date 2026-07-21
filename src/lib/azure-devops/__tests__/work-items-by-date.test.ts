import { describe, expect, it } from "vitest";

import {
  buildCompletedWorkGtZeroCondition,
  buildCreatedDateRangeConditions,
  buildWorkingDateRangeConditions,
  dedupeBugsById,
} from "@/lib/azure-devops/work-items-by-date";

const FIELD = "Custom.WorkingDate";
const TZ = "America/Bogota";

describe("buildWorkingDateRangeConditions", () => {
  it("genera rango [start, end+1día) con precisión de hora en la zona del proyecto", () => {
    const conditions = buildWorkingDateRangeConditions(
      FIELD,
      "2026-06-22",
      "2026-07-03",
      TZ,
    );

    expect(conditions).toEqual([
      "[Custom.WorkingDate] >= '2026-06-22T05:00:00.000Z'",
      "[Custom.WorkingDate] < '2026-07-04T05:00:00.000Z'",
    ]);
  });

  it("acepta start == end (un solo día, inclusivo)", () => {
    const conditions = buildWorkingDateRangeConditions(
      FIELD,
      "2026-06-22",
      "2026-06-22",
      TZ,
    );

    expect(conditions).toEqual([
      "[Custom.WorkingDate] >= '2026-06-22T05:00:00.000Z'",
      "[Custom.WorkingDate] < '2026-06-23T05:00:00.000Z'",
    ]);
  });

  it("respeta el cambio de hora del proyecto", () => {
    const conditions = buildWorkingDateRangeConditions(
      FIELD,
      "2026-01-09",
      "2026-01-09",
      "America/Bogota",
    );

    expect(conditions[0]).toBe("[Custom.WorkingDate] >= '2026-01-09T05:00:00.000Z'");
    expect(conditions[1]).toBe("[Custom.WorkingDate] < '2026-01-10T05:00:00.000Z'");
  });
});

describe("buildCreatedDateRangeConditions", () => {
  it("filtra siempre por [System.CreatedDate] (campo estándar, presente en todos los work items)", () => {
    const conditions = buildCreatedDateRangeConditions(
      "2026-06-22",
      "2026-07-03",
      TZ,
    );

    expect(conditions).toEqual([
      "[System.CreatedDate] >= '2026-06-22T05:00:00.000Z'",
      "[System.CreatedDate] < '2026-07-04T05:00:00.000Z'",
    ]);
  });

  it("acepta start == end (un solo día, inclusivo)", () => {
    const conditions = buildCreatedDateRangeConditions(
      "2026-06-22",
      "2026-06-22",
      TZ,
    );

    expect(conditions).toEqual([
      "[System.CreatedDate] >= '2026-06-22T05:00:00.000Z'",
      "[System.CreatedDate] < '2026-06-23T05:00:00.000Z'",
    ]);
  });

  it("respeta el cambio de hora del proyecto", () => {
    const conditions = buildCreatedDateRangeConditions(
      "2026-01-09",
      "2026-01-09",
      "America/Bogota",
    );

    expect(conditions[0]).toBe("[System.CreatedDate] >= '2026-01-09T05:00:00.000Z'");
    expect(conditions[1]).toBe("[System.CreatedDate] < '2026-01-10T05:00:00.000Z'");
  });
});

describe("buildCompletedWorkGtZeroCondition", () => {
  it("devuelve null cuando completedWorkField es null (proyecto sin campo)", () => {
    expect(buildCompletedWorkGtZeroCondition(null)).toBeNull();
  });

  it("devuelve null cuando completedWorkField es string vacío", () => {
    expect(buildCompletedWorkGtZeroCondition("")).toBeNull();
  });

  it("devuelve la condición WIQL con el reference name por defecto", () => {
    expect(
      buildCompletedWorkGtZeroCondition(
        "Microsoft.VSTS.Scheduling.CompletedWork",
      ),
    ).toBe("[Microsoft.VSTS.Scheduling.CompletedWork] > '0'");
  });

  it("respeta el reference name custom configurado por el admin", () => {
    expect(buildCompletedWorkGtZeroCondition("Custom.HoursLogged")).toBe(
      "[Custom.HoursLogged] > '0'",
    );
  });
});

describe("dedupeBugsById", () => {
  it("devuelve [] cuando la entrada está vacía", () => {
    expect(dedupeBugsById([])).toEqual([]);
  });

  it("preserva un solo bug sin cambios", () => {
    const bug = { id: 1, title: "Único" };
    expect(dedupeBugsById([bug as never])).toEqual([bug]);
  });

  it("une tres criterios (OR) sin duplicados cuando los ids son distintos", () => {
    const result = dedupeBugsById([
      { id: 1, title: "Por creación" },
      { id: 2, title: "Por iteración" },
      { id: 3, title: "Por padre" },
    ] as never[]);
    expect(result.map((b) => b.id)).toEqual([1, 2, 3]);
  });

  it("deduplica cuando el mismo bug aparece en los tres criterios", () => {
    const shared = { id: 10, title: "Bug en varios criterios" };
    const result = dedupeBugsById([shared, shared, shared] as never[]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(shared);
  });

  it("deduplica parcialmente cuando dos de tres criterios devuelven el mismo id", () => {
    const overlap = { id: 20, title: "Overlap" };
    const onlyByParent = { id: 30, title: "Solo por padre" };
    const result = dedupeBugsById([
      { id: 5, title: "Creado" },
      overlap,
      overlap,
      onlyByParent,
    ] as never[]);
    expect(result.map((b) => b.id)).toEqual([5, 20, 30]);
  });

  it("ordena el resultado por id ascendente (orden estable)", () => {
    const result = dedupeBugsById([
      { id: 30, title: "c" },
      { id: 10, title: "a" },
      { id: 20, title: "b" },
    ] as never[]);
    expect(result.map((b) => b.id)).toEqual([10, 20, 30]);
  });
});
