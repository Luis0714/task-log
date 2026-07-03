import { describe, expect, it } from "vitest";

import type { AdoSprintDto } from "@/lib/schemas/ado-catalog";
import {
  BACKLOG_SPRINT_LABEL,
  BACKLOG_SPRINT_VALUE,
} from "@/lib/time-log/backlog-scope";
import { sprintSelectOptions } from "@/lib/time-log/context-select-options";

const sprints: AdoSprintDto[] = [
  { id: "1", name: "Sprint 1", path: "Proyecto\\Sprint 1", timeFrame: "current" },
];

describe("sprintSelectOptions", () => {
  it("no incluye la opción de backlog por defecto", () => {
    const options = sprintSelectOptions(sprints);
    expect(options).toHaveLength(1);
    expect(options[0]?.value).toBe("Proyecto\\Sprint 1");
  });

  it("antepone Backlog completo cuando se habilita", () => {
    const options = sprintSelectOptions(sprints, { includeBacklogOption: true });
    expect(options).toHaveLength(2);
    expect(options[0]).toMatchObject({
      value: BACKLOG_SPRINT_VALUE,
      label: BACKLOG_SPRINT_LABEL,
    });
  });
});
