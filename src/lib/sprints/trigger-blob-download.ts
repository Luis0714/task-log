const REVOKE_BLOB_URL_DELAY_MS = 60_000;

/**
 * Navega a una URL same-origin con Content-Disposition. Más fiable que blob URLs
 * para PDFs en Chrome/Edge (Windows), que suelen ignorar el atributo download.
 */
export function triggerDirectDownload(url: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

/**
 * Descarga un blob con nombre de archivo. Para PDF usa octet-stream porque
 * Chrome/Edge ignoran `download` en blobs application/pdf y proponen un UUID.
 */
export function triggerBlobDownload(
  blob: Blob,
  filename: string,
  mimeType?: string,
): void {
  const resolvedMimeType = mimeType ?? blob.type ?? "application/octet-stream";
  const downloadMimeType =
    resolvedMimeType === "application/pdf"
      ? "application/octet-stream"
      : resolvedMimeType;
  const typedBlob = blob.slice(0, blob.size, downloadMimeType);
  const url = URL.createObjectURL(typedBlob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_BLOB_URL_DELAY_MS);
}
