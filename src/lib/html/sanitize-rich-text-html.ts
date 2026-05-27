import DOMPurify from "dompurify";

/** Sanitiza HTML rich de ADO. Solo cliente. Las imágenes embebidas se omiten (requieren auth en ADO). */
export function sanitizeRichTextHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["img"],
    ADD_ATTR: ["target", "alt", "title"],
  });
}
