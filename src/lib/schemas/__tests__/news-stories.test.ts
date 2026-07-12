import { describe, expect, it } from "vitest";

import {
  linkNewsStoryBodySchema,
  newsStoriesFilterSchema,
} from "@/lib/schemas/news-stories";

describe("newsStoriesFilterSchema", () => {
  it("acepta un filtro multi-scope válido", () => {
    const result = newsStoriesFilterSchema.safeParse({
      projects: ["A", "B"],
      teams: ["Backend", "Frontend"],
    });
    expect(result.success).toBe(true);
  });

  it("acepta sin projects ni teams (sin filtro)", () => {
    const result = newsStoriesFilterSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rechaza un elemento vacío dentro del array projects", () => {
    const result = newsStoriesFilterSchema.safeParse({
      projects: ["   "],
    });
    expect(result.success).toBe(false);
  });

  it("rechaza un elemento vacío dentro del array teams", () => {
    const result = newsStoriesFilterSchema.safeParse({
      teams: [""],
    });
    expect(result.success).toBe(false);
  });
});

describe("linkNewsStoryBodySchema", () => {
  it("acepta un payload válido", () => {
    const result = linkNewsStoryBodySchema.safeParse({
      projectId: "Proyecto A",
      teamId: "Backend",
      workItemId: 3421,
      workItemTitle: "Novedades Junio",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza workItemId no positivo", () => {
    expect(
      linkNewsStoryBodySchema.safeParse({
        projectId: "Proyecto A",
        workItemId: 0,
      }).success,
    ).toBe(false);
    expect(
      linkNewsStoryBodySchema.safeParse({
        projectId: "Proyecto A",
        workItemId: -1,
      }).success,
    ).toBe(false);
  });

  it("acepta workItemId como string numérico (coerce)", () => {
    const result = linkNewsStoryBodySchema.safeParse({
      projectId: "Proyecto A",
      workItemId: "3421",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.workItemId).toBe(3421);
  });
});
