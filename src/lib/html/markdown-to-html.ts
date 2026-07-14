/**
 * Conversor de Markdown → HTML enfocado en lo que Azure DevOps devuelve cuando
 * un campo rich-text está configurado como "Plain Text" o cuando los usuarios
 * pegan markdown directamente (p. ej. `Microsoft.VSTS.TCM.ReproSteps` en
 * algunos procesos, o bloques pegados desde herramientas externas).
 *
 * Soporta lo que necesitamos en la app:
 *   - Listas ordenadas y no ordenadas
 *   - Encabezados `#`/`##`/`###`
 *   - Imágenes `![alt](url)` — los adjuntos de Azure se enrutan por el proxy
 *     local `/api/ado/attachments/proxy?url=...`
 *   - Enlaces `[texto](url)`
 *   - Negrita `**x**` / `__x__`, cursiva `*x*` / `_x_`, código `` `x` ``
 *
 * No es un conversor markdown completo (no soporta tablas, code fences, ni
 * blockquotes). Es deliberadamente pequeño y testeable.
 *
 * Para HTML ya marcado, devuelve el contenido intacto. La detección vive en
 * `looksLikeMarkdown`: si la entrada tiene cualquier `<etiqueta>`, se asume
 * que ya es HTML y se respeta.
 */

const ADO_ATTACHMENT_PATH = /\/_apis\/wit\/attachments\//i;

export function isAdoAttachmentUrl(url: string): boolean {
  return ADO_ATTACHMENT_PATH.test(url);
}

function proxiedImageUrl(rawUrl: string): string {
  return isAdoAttachmentUrl(rawUrl)
    ? `/api/ado/attachments/proxy?url=${encodeURIComponent(rawUrl)}`
    : rawUrl;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Aplica las reglas inline (imágenes, enlaces, negrita, cursiva, código).
 * Asume que `value` ya viene escapado para HTML.
 */
function renderInline(value: string): string {
  let text = value;
  // 1. Imágenes: ![alt](url "title opcional") — antes de los enlaces porque su
  //    regex se solapa.
  text = text.replace(
    /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    (_match, alt, url) =>
      `<img src="${escapeHtml(proxiedImageUrl(url))}" alt="${alt}" />`,
  );
  // 2. Enlaces: [texto](url "title opcional")
  text = text.replace(
    /\[([^\]]+)\]\(([^)\s]+)\s+"[^"]*"\)/g,
    (_m, label, url) => `<a href="${escapeHtml(url)}">${label}</a>`,
  );
  text = text.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_m, label, url) => `<a href="${escapeHtml(url)}">${label}</a>`,
  );
  // 3. Negrita: **x** o __x__
  text = text.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__([^_\n]+)__/g, "<strong>$1</strong>");
  // 4. Cursiva: *x* o _x_ (cuidadoso de no romper las ya procesadas).
  text = text.replace(/(^|[^*\w])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  text = text.replace(/(^|[^_\w])_([^_\n]+)_/g, "$1<em>$2</em>");
  // 5. Código inline: `x`
  text = text.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  return text;
}

/**
 * Heurística conservativa: si la entrada contiene CUALQUIER etiqueta HTML,
 * asumimos que ya es HTML (proveniente del editor TipTap) y la respetamos.
 * Si solo tiene patrones markdown, lo convertimos.
 */
export function looksLikeMarkdown(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (/<[a-z][\s\S]*?>/i.test(trimmed)) return false;

  return (
    /^\s*(?:\d+\.|--?|\*\*?)\s+/m.test(trimmed) ||
    /^\s*#{1,6}\s\S/m.test(trimmed) ||
    /!\[[^\]]*\]\([^)]+\)/.test(trimmed) ||
    /\[[^\]]+\]\([^)]+\)/.test(trimmed) ||
    /\*\*[^*\n]+\*\*/.test(trimmed)
  );
}

function flushParagraph(buf: string[], out: string[]): void {
  if (buf.length === 0) return;
  const text = buf.join(" ").replace(/\s+/g, " ").trim();
  if (text) out.push(`<p>${renderInline(escapeHtml(text))}</p>`);
  buf.length = 0;
}

function closeList(out: string[], state: { type: "ul" | "ol" | null }): void {
  if (state.type) {
    out.push(`</${state.type}>`);
    state.type = null;
  }
}

/**
 * Convierte markdown → HTML. Pensado para entradas chiquitas a medianas
 * (descripciones de ADO, listas de pasos). Hace streaming línea por línea
 * para no pagar el costo de parsear todo el cuerpo dos veces.
 */
export function markdownToHtml(input: string): string {
  const text = input.replace(/\r\n?/g, "\n");
  const lines = text.split("\n");
  const out: string[] = [];
  const paragraph: string[] = [];
  const listState: { type: "ul" | "ol" | null } = { type: null };

  const finalize = () => {
    flushParagraph(paragraph, out);
    closeList(out, listState);
  };

  for (const raw of lines) {
    const line = raw.trimEnd();

    const headingMatch = /^(#{1,6})\s+([^\n]+)$/.exec(line);
    if (headingMatch) {
      flushParagraph(paragraph, out);
      closeList(out, listState);
      const level = headingMatch[1].length;
      out.push(`<h${level}>${renderInline(escapeHtml(headingMatch[2].trim()))}</h${level}>`);
      continue;
    }

    const olMatch = /^\s*\d+\.\s+([^\n]+)$/.exec(line);
    if (olMatch) {
      flushParagraph(paragraph, out);
      if (listState.type !== "ol") {
        closeList(out, listState);
        out.push("<ol>");
        listState.type = "ol";
      }
      out.push(`<li>${renderInline(escapeHtml(olMatch[1].trim()))}</li>`);
      continue;
    }

    const ulMatch = /^\s*[-*]\s+([^\n]+)$/.exec(line);
    if (ulMatch) {
      flushParagraph(paragraph, out);
      if (listState.type !== "ul") {
        closeList(out, listState);
        out.push("<ul>");
        listState.type = "ul";
      }
      out.push(`<li>${renderInline(escapeHtml(ulMatch[1].trim()))}</li>`);
      continue;
    }

    if (!line.trim()) {
      flushParagraph(paragraph, out);
      closeList(out, listState);
      continue;
    }

    paragraph.push(line.trim());
  }

  finalize();
  return out.join("");
}

/**
 * Punto de entrada único para el render de descripciones de ADO: si la entrada
 * parece markdown, la convierte; si ya es HTML (por el editor TipTap), la pasa
 * intacta. Es seguro llamar con `undefined`/`null`/"".
 */
export function normalizeAdoRichText(input: string | null | undefined): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";
  return looksLikeMarkdown(trimmed) ? markdownToHtml(trimmed) : trimmed;
}
