import { describe, expect, it } from "vitest";

import { validateLinkNewsStory } from "@/lib/news-stories/validate";

describe("validateLinkNewsStory", () => {
  const baseInput = {
    projectId: "Proyecto A",
    teamId: "Backend",
    workItemId: 3421,
    workItemTitle: "Novedades Junio",
    linkedByUserId: "user-1",
  };

  it("acepta un payload válido", () => {
    const result = validateLinkNewsStory(baseInput);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input).toMatchObject({
        projectId: "Proyecto A",
        teamId: "Backend",
        workItemId: 3421,
        workItemTitleSnapshot: "Novedades Junio",
        linkedByUserId: "user-1",
      });
    }
  });

  it("normaliza teamId vacío a null", () => {
    const result = validateLinkNewsStory({ ...baseInput, teamId: "   " });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.teamId).toBeNull();
    }
  });

  it("trim espacios en projectId", () => {
    const result = validateLinkNewsStory({ ...baseInput, projectId: "  Proyecto A  " });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.input.projectId).toBe("Proyecto A");
  });

  it("rechaza projectId vacío", () => {
    const result = validateLinkNewsStory({ ...baseInput, projectId: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("missingProjectId");
  });

  it("rechaza workItemId no entero positivo", () => {
    expect(validateLinkNewsStory({ ...baseInput, workItemId: 0 }).ok).toBe(false);
    expect(validateLinkNewsStory({ ...baseInput, workItemId: -1 }).ok).toBe(false);
    expect(
      validateLinkNewsStory({ ...baseInput, workItemId: 3.14 }).ok,
    ).toBe(false);
  });

  it("acepta workItemId como string numérico (coerce)", () => {
    const result = validateLinkNewsStory({ ...baseInput, workItemId: "3421" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.input.workItemId).toBe(3421);
  });

  it("normaliza workItemTitle a null si llega vacío", () => {
    const result = validateLinkNewsStory({ ...baseInput, workItemTitle: "   " });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.input.workItemTitleSnapshot).toBeNull();
  });
});
