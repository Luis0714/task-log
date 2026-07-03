import { describe, expect, it } from "vitest";

import type { AdoSprintDto } from "@/lib/schemas/ado-catalog";
import { BACKLOG_SPRINT_VALUE } from "@/lib/time-log/backlog-scope";
import { pickSprint } from "@/lib/time-log/context-defaults";

const sprints: AdoSprintDto[] = [
  { id: "1", name: "Sprint 1", path: "Proyecto\\Sprint 1", timeFrame: "current" },
  { id: "2", name: "Sprint 2", path: "Proyecto\\Sprint 2", timeFrame: "future" },
];

describe("pickSprint", () => {
  it("conserva el sprint actual si existe en el catálogo", () => {
    expect(pickSprint("Proyecto\\Sprint 2", sprints)).toBe("Proyecto\\Sprint 2");
  });

  it("cae al sprint preferente si el valor no existe", () => {
    expect(pickSprint("Proyecto\\Inexistente", sprints)).toBe("Proyecto\\Sprint 1");
  });

  it("rechaza el scope backlog sin la opción habilitada", () => {
    expect(pickSprint(BACKLOG_SPRINT_VALUE, sprints)).toBe("Proyecto\\Sprint 1");
  });

  it("acepta el scope backlog con allowBacklogScope", () => {
    expect(pickSprint(BACKLOG_SPRINT_VALUE, sprints, { allowBacklogScope: true })).toBe(
      BACKLOG_SPRINT_VALUE,
    );
  });
});
