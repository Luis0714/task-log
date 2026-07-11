import { describe, expect, it } from "vitest";

import {
  isNumericIdQuery,
  searchNewsStoriesQuerySchema,
} from "@/lib/schemas/news-stories";

describe("searchNewsStoriesQuerySchema", () => {
  it("acepta IDs numéricos positivos sin exigir 3 caracteres", () => {
    const result = searchNewsStoriesQuerySchema.safeParse({
      project: "Proyecto A",
      q: "1",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.q).toBe("1");
  });

  it("acepta IDs numéricos grandes", () => {
    const result = searchNewsStoriesQuerySchema.safeParse({
      project: "Proyecto A",
      q: "3421",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza q vacía", () => {
    const result = searchNewsStoriesQuerySchema.safeParse({
      project: "Proyecto A",
      q: "",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza texto de menos de 3 caracteres", () => {
    const result = searchNewsStoriesQuerySchema.safeParse({
      project: "Proyecto A",
      q: "ab",
    });
    expect(result.success).toBe(false);
  });

  it("acepta texto de al menos 3 caracteres", () => {
    const result = searchNewsStoriesQuerySchema.safeParse({
      project: "Proyecto A",
      q: "nov",
    });
    expect(result.success).toBe(true);
  });

  it("rechaza project vacío", () => {
    const result = searchNewsStoriesQuerySchema.safeParse({
      project: "",
      q: "3421",
    });
    expect(result.success).toBe(false);
  });

  it("recorta espacios al inicio y al final de q", () => {
    const result = searchNewsStoriesQuerySchema.safeParse({
      project: "Proyecto A",
      q: " 3421 ",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.q).toBe("3421");
  });

  it("rechaza ID numérico cero", () => {
    const result = searchNewsStoriesQuerySchema.safeParse({
      project: "Proyecto A",
      q: "0",
    });
    expect(result.success).toBe(false);
  });
});

describe("isNumericIdQuery", () => {
  it("reconoce IDs positivos", () => {
    expect(isNumericIdQuery("3421")).toBe(true);
    expect(isNumericIdQuery("  42 ")).toBe(true);
  });

  it("rechaza ceros y vacíos", () => {
    expect(isNumericIdQuery("0")).toBe(false);
    expect(isNumericIdQuery("")).toBe(false);
  });

  it("rechaza textos no numéricos", () => {
    expect(isNumericIdQuery("Novedades")).toBe(false);
    expect(isNumericIdQuery("3421a")).toBe(false);
  });
});