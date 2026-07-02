import { describe, expect, it } from "vitest";

import {
  looksLikeMarkdown,
  markdownToHtml,
  normalizeAdoRichText,
} from "@/lib/html/markdown-to-html";

const ADO_IMG = "https://dev.azure.com/technologyfactory/683517a1-3edc-42cb-9468-338c6cb383eb/_apis/wit/attachments/19204efd-16b8-4dd9-8ca0-9a0ae19a46f0?fileName=image.png";
const ADO_IMG_2 = "https://dev.azure.com/technologyfactory/683517a1-3edc-42cb-9468-338c6cb383eb/_apis/wit/attachments/eae602a8-582b-4113-afdc-625cd215d66b?fileName=image.png";

describe("looksLikeMarkdown", () => {
  it("returns false for empty / plain text", () => {
    expect(looksLikeMarkdown("")).toBe(false);
    expect(looksLikeMarkdown("Hola mundo sin símbolos")).toBe(false);
  });

  it("returns false when the input already contains HTML tags", () => {
    expect(looksLikeMarkdown("<p>Hola</p>")).toBe(false);
    expect(looksLikeMarkdown("<img src=\"https://x.com/a.png\" />")).toBe(false);
  });

  it("detects numbered and bulleted lists", () => {
    expect(looksLikeMarkdown("1. Primero\n2. Segundo")).toBe(true);
    expect(looksLikeMarkdown("- Uno\n- Dos")).toBe(true);
  });

  it("detects markdown images and links", () => {
    expect(looksLikeMarkdown(`![x](${ADO_IMG})`)).toBe(true);
    expect(looksLikeMarkdown("[label](https://example.com)")).toBe(true);
  });

  it("detects bold and headings", () => {
    expect(looksLikeMarkdown("**negrita**")).toBe(true);
    expect(looksLikeMarkdown("# Título")).toBe(true);
  });
});

describe("markdownToHtml", () => {
  it("convierte una lista numerada en HTML con <ol><li>", () => {
    const html = markdownToHtml("1. Uno\n2. Dos\n3. Tres");
    expect(html).toContain("<ol>");
    expect(html).toContain("<li>Uno</li>");
    expect(html).toContain("<li>Dos</li>");
    expect(html).toContain("<li>Tres</li>");
    expect(html).toContain("</ol>");
  });

  it("convierte una lista con viñetas en HTML con <ul><li>", () => {
    const html = markdownToHtml("- Uno\n- Dos");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>Uno</li>");
    expect(html).toContain("<li>Dos</li>");
    expect(html).toContain("</ul>");
  });

  it("re-enruta imágenes de Azure DevOps a través del proxy local", () => {
    const html = markdownToHtml(`Ver imagen: ![image.png](${ADO_IMG})`);
    expect(html).toContain("<img");
    expect(html).toContain(`src="/api/ado/attachments/proxy?url=${encodeURIComponent(ADO_IMG)}"`);
    expect(html).toContain('alt="image.png"');
  });

  it("deja imágenes que no son de Azure sin tocar", () => {
    const external = "https://example.com/imagen.png";
    const html = markdownToHtml(`![x](${external})`);
    expect(html).toContain(`src="${external}"`);
    expect(html).not.toContain("/api/ado/attachments/proxy");
  });

  it("renderiza enlaces, negrita y cursiva en línea", () => {
    const html = markdownToHtml("Texto con **negrita** y *cursiva* y [link](https://x.com).");
    expect(html).toContain("<strong>negrita</strong>");
    expect(html).toContain("<em>cursiva</em>");
    expect(html).toContain('<a href="https://x.com">link</a>');
  });

  it("escapa HTML embebido para evitar inyecciones", () => {
    const html = markdownToHtml("<script>alert('xss')</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("convierte headings en h1/h2 según la cantidad de #", () => {
    const html = markdownToHtml("# Título\n## Subtítulo");
    expect(html).toContain("<h1>Título</h1>");
    expect(html).toContain("<h2>Subtítulo</h2>");
  });

  it("maneja el caso real del bug: lista numerada con varias imágenes intercaladas", () => {
    const md = [
      "1. Ingresar a la plataforma como gestor de contenido",
      "2. Crear un plan de área",
      "3. Crear una competencia y actividad",
      "4. Añadir una infografía",
      `5. Confirmar: ![image.png](${ADO_IMG})`,
      `6. Editar de nuevo: ![image.png](${ADO_IMG_2})`,
    ].join("\n");
    const html = markdownToHtml(md);
    expect(html).toContain("<ol>");
    expect(html).toContain("<li>Ingresar a la plataforma");
    expect(html).toContain("<li>Crear un plan de área</li>");
    expect(html).toContain('src="/api/ado/attachments/proxy?url=');
    // Ambas imágenes re-enrutadas:
    expect(html).toContain(encodeURIComponent(ADO_IMG));
    expect(html).toContain(encodeURIComponent(ADO_IMG_2));
    expect(html).not.toContain("dev.azure.com/"); // el host original no debe quedar en src
  });
});

describe("normalizeAdoRichText", () => {
  it("devuelve '' para entradas vacías / nulas", () => {
    expect(normalizeAdoRichText(null)).toBe("");
    expect(normalizeAdoRichText(undefined)).toBe("");
    expect(normalizeAdoRichText("")).toBe("");
    expect(normalizeAdoRichText("   \n\t ")).toBe("");
  });

  it("devuelve HTML intacto si ya viene marcado", () => {
    const html = "<p>Hola <strong>mundo</strong></p>";
    expect(normalizeAdoRichText(html)).toBe(html);
  });

  it("convierte markdown cuando lo detecta", () => {
    const md = "1. Uno\n2. Dos";
    const result = normalizeAdoRichText(md);
    expect(result).toContain("<ol>");
    expect(result).toContain("<li>Uno</li>");
  });
});
