export function canCopyImageToClipboard(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    typeof navigator.clipboard?.write === "function" &&
    typeof ClipboardItem !== "undefined"
  );
}

export async function copyImageBlobToClipboard(blob: Blob): Promise<void> {
  if (!canCopyImageToClipboard()) {
    throw new Error("Tu navegador no permite copiar imágenes al portapapeles.");
  }

  const pngBlob = blob.type === "image/png" ? blob : blob.slice(0, blob.size, "image/png");

  await navigator.clipboard.write([
    new ClipboardItem({
      "image/png": pngBlob,
    }),
  ]);
}
