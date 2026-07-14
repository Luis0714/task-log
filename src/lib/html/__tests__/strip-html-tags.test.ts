import { describe, expect, it } from "vitest";

import { stripHtmlTags } from "@/lib/html/strip-html-tags";

describe("stripHtmlTags", () => {
  it("remueve una etiqueta simple", () => {
    expect(stripHtmlTags("hola <strong>mundo</strong>")).toBe("hola mundo");
  });

  it("remueve múltiples etiquetas", () => {
    expect(stripHtmlTags("<p>a</p><p>b</p>")).toBe("ab");
  });

  it("preserva texto sin etiquetas intacto", () => {
    expect(stripHtmlTags("sin tags")).toBe("sin tags");
  });

  it("maneja string vacío", () => {
    expect(stripHtmlTags("")).toBe("");
  });

  it("remueve atributos dentro de la etiqueta", () => {
    expect(stripHtmlTags('<a href="x" class="y">link</a>')).toBe("link");
  });

  it("no entra en bucle con << sin cerrar", () => {
    expect(stripHtmlTags("a<b<c")).toBe("a");
  });
});