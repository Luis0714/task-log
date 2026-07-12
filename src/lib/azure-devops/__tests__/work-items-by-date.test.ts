import { describe, expect, it } from "vitest";

import {
  buildCompletedWorkGtZeroCondition,
  buildWorkingDateRangeConditions,
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
