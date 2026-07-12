import type { NewsStoryValidationEntry } from "@/lib/news-stories/types";

export type LinkedRenamedHintProps = Readonly<{
  validation: NewsStoryValidationEntry | undefined;
}>;

/**
 * Texto secundario que aparece bajo el título de la fila cuando la HU fue
 * renombrada en Azure. Muestra el título actual para que el admin vea qué
 * pasó antes de que el snapshot local quedara obsoleto.
 */
export function LinkedRenamedHint({ validation }: LinkedRenamedHintProps) {
  if (validation?.status !== "renamed") return null;
  const title = validation.currentTitle?.trim();
  if (!title) return null;
  return (
    <span className="text-muted-foreground mt-0.5 block text-xs">
      Renombrada a: {title}
    </span>
  );
}
