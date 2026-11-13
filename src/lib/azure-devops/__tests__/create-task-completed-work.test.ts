import { describe, expect, it } from "vitest";

import {
  isCompletedWorkReadOnlyError,
  omitReadOnlyCompletedWork,
  STANDARD_COMPLETED_WORK_FIELD,
} from "@/lib/azure-devops/create-task-completed-work";

const COMPLETED_WORK_ERROR =
  'TF401320: Rule Error for field Completed Work. Error code: ReadOnly, InvalidNotOldValue. "fieldReferenceName":"Microsoft.VSTS.Scheduling.CompletedWork"';

describe("isCompletedWorkReadOnlyError", () => {
  it("reconoce el campo de solo lectura", () => {
    expect(isCompletedWorkReadOnlyError(COMPLETED_WORK_ERROR)).toBe(true);
  });

  it("ignora otro error de regla", () => {
    expect(
      isCompletedWorkReadOnlyError(
        "TF401320: Rule Error for field Original Estimate. Error code: Required, InvalidEmpty.",
      ),
    ).toBe(false);
  });
});

describe("omitReadOnlyCompletedWork", () => {
  it("quita Completed Work y conserva el resto", () => {
    const ops = [
      { path: "/fields/System.Title" },
      { path: `/fields/${STANDARD_COMPLETED_WORK_FIELD}` },
      { path: "/fields/System.State" },
    ];

    expect(omitReadOnlyCompletedWork(ops)).toEqual([
      { path: "/fields/System.Title" },
      { path: "/fields/System.State" },
    ]);
  });

  it("no reintenta si el campo no iba en el alta", () => {
    expect(omitReadOnlyCompletedWork([{ path: "/fields/System.Title" }])).toBeNull();
  });
});
