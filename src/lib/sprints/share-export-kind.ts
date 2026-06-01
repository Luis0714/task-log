export type ShareExportKind = "image" | "pdf";

export function getShareExportLoadingMessage(kind: ShareExportKind): string {
  return kind === "pdf" ? "Generando PDF…" : "Generando imagen…";
}
