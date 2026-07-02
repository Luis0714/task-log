import DOMPurify from "dompurify";

export function sanitizeRichTextHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target", "alt", "title"],
  });
}
