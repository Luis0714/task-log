import { describe, expect, it } from "vitest";

import {
  BACKLOG_SPRINT_VALUE,
  isBacklogScope,
  resolveExecutionSprintPath,
} from "@/lib/time-log/backlog-scope";

describe("isBacklogScope", () => {
  it("reconoce el valor sentinel", () => {
    expect(isBacklogScope(BACKLOG_SPRINT_VALUE)).toBe(true);
    expect(isBacklogScope(` ${BACKLOG_SPRINT_VALUE} `)).toBe(true);
  });

  it("rechaza rutas de sprint reales y valores vacíos", () => {
    expect(isBacklogScope("Proyecto\\Sprint 1")).toBe(false);
    expect(isBacklogScope("")).toBe(false);
    expect(isBacklogScope(null)).toBe(false);
    expect(isBacklogScope(undefined)).toBe(false);
  });
});

describe("resolveExecutionSprintPath", () => {
  it("devuelve vacío en scope backlog para heredar la iteración de la HU", () => {
    expect(resolveExecutionSprintPath(BACKLOG_SPRINT_VALUE)).toBe("");
  });

  it("conserva la ruta de un sprint real", () => {
    expect(resolveExecutionSprintPath("Proyecto\\Sprint 1")).toBe("Proyecto\\Sprint 1");
  });
});
