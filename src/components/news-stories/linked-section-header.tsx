"use client";

import { Loader2 } from "lucide-react";

export type LinkedSectionHeaderProps = Readonly<{
  subtitle: string;
  validationLoading: boolean;
  /** Slot externo — el shell mete el "Vincular HU" button aquí. */
  renderLinkTrigger?: () => React.ReactNode;
}>;

/**
 * Cabecera de la sección "HUs vinculadas": título + subtítulo + loader de
 * validación contra Azure + slot para el trigger del diálogo.
 */
export function LinkedSectionHeader({
  subtitle,
  validationLoading,
  renderLinkTrigger,
}: LinkedSectionHeaderProps) {
  return (
    <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-semibold">Historias de usuario vinculadas</h2>
        <p className="text-muted-foreground text-xs">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {validationLoading ? (
          <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
            <Loader2 className="size-3 animate-spin" aria-hidden />
            Validando contra Azure…
          </span>
        ) : null}
        {renderLinkTrigger?.()}
      </div>
    </header>
  );
}
