import { describe, expect, it } from "vitest";

import {
  applyReviewTimesSearchParams,
  parseReviewTimesSearchParams,
  recordToSearchParams,
} from "@/lib/review-times/search-params";

const OPTIONS = {
  timeZone: "America/Bogota",
  defaultRepository: "NARP-WEB",
  knownRepositories: ["NARP-WEB", "task-log"],
  now: new Date("2026-10-20T18:00:00.000Z"),
};

describe("parseReviewTimesSearchParams", () => {
  it("usa el mes actual y el repositorio por defecto cuando la url no los trae", () => {
    const parsed = parseReviewTimesSearchParams({ project: "NARP" }, OPTIONS);

    expect(parsed.isCanonical).toBe(false);
    expect(parsed.state.monthKeys).toEqual(["2026-10"]);
    expect(parsed.state.repositories).toEqual(["NARP-WEB"]);
    expect(parsed.state.allRepositories).toBe(false);
  });

  it("respeta los repositorios y el mes que ya vienen en la url", () => {
    const parsed = parseReviewTimesSearchParams(
      { month: "2026-09", repository: ["task-log", "NARP-WEB"] },
      OPTIONS,
    );

    expect(parsed.isCanonical).toBe(true);
    expect(parsed.state.monthKeys).toEqual(["2026-09"]);
    expect(parsed.state.repositories).toEqual(["task-log", "NARP-WEB"]);
  });

  it("acepta hasta tres meses y descarta el resto", () => {
    const parsed = parseReviewTimesSearchParams(
      { month: ["2026-12", "2026-01", "2026-all", "2026-06", "2026-03"] },
      OPTIONS,
    );

    expect(parsed.isCanonical).toBe(false);
    expect(parsed.state.monthKeys).toEqual(["2026-01", "2026-03", "2026-06"]);
  });

  it("descarta repositorios que no pertenecen al proyecto", () => {
    const parsed = parseReviewTimesSearchParams(
      { month: "2026-10", repository: ["task-log", "otro"] },
      OPTIONS,
    );

    expect(parsed.isCanonical).toBe(false);
    expect(parsed.state.repositories).toEqual(["task-log"]);
    expect(parsed.state.allRepositories).toBe(false);
  });

  it("deja todos los repositorios cuando la url lo pide", () => {
    const parsed = parseReviewTimesSearchParams(
      { month: "2026-10", repos: "all" },
      OPTIONS,
    );

    expect(parsed.isCanonical).toBe(true);
    expect(parsed.state.allRepositories).toBe(true);
    expect(parsed.state.repositories).toEqual([]);
  });

  it("no impone un repositorio por defecto que no existe en el proyecto", () => {
    const parsed = parseReviewTimesSearchParams(
      {},
      { ...OPTIONS, knownRepositories: ["task-log"] },
    );

    expect(parsed.state.allRepositories).toBe(true);
    expect(parsed.state.repositories).toEqual([]);
  });
});

describe("applyReviewTimesSearchParams", () => {
  it("escribe el mes y el repositorio sin borrar el proyecto", () => {
    const parsed = parseReviewTimesSearchParams({ project: "NARP" }, OPTIONS);
    const params = applyReviewTimesSearchParams(
      recordToSearchParams({ project: "NARP" }),
      parsed.state,
    );

    expect(params.get("project")).toBe("NARP");
    expect(params.get("month")).toBe("2026-10");
    expect(params.getAll("repository")).toEqual(["NARP-WEB"]);
    expect(params.get("repos")).toBeNull();
  });
});
