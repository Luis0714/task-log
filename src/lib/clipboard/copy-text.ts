export function canCopyTextToClipboard(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function";
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (!canCopyTextToClipboard()) {
    throw new Error("Tu navegador no permite copiar al portapapeles.");
  }

  await navigator.clipboard.writeText(text);
}
