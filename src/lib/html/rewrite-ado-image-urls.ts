const ADO_IMG_RE = /(<img\b[^>]*\bsrc=")([^"]+\/_apis\/wit\/attachments\/[^"]+)(")/gi;
const PROXY_IMG_RE = /(<img\b[^>]*\bsrc=")\/api\/ado\/attachments\/proxy\?url=([^"]+)(")/gi;

export function rewriteAdoImgSrcsForDisplay(html: string): string {
  return html.replace(
    ADO_IMG_RE,
    (_, before, src, after) =>
      `${before}/api/ado/attachments/proxy?url=${encodeURIComponent(src)}${after}`,
  );
}

export function rewriteProxyImgSrcsForStorage(html: string): string {
  return html.replace(
    PROXY_IMG_RE,
    (_, before, encoded, after) =>
      `${before}${decodeURIComponent(encoded)}${after}`,
  );
}
