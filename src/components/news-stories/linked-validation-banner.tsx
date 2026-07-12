"use client";

import { Button } from "@/components/ui/button";

export type LinkedValidationBannerProps = Readonly<{
  error: string;
  onRetry: () => void;
}>;

/**
 * Banner de error + botón "Reintentar" que se muestra sobre la lista cuando
 * `/api/news-stories/validate` falla. Sólo aparece si `validationError` no es
 * `null`.
 */
export function LinkedValidationBanner({
  error,
  onRetry,
}: LinkedValidationBannerProps) {
  return (
    <div className="text-muted-foreground flex items-center justify-between gap-2 rounded-lg border border-dashed py-2 pl-3 pr-2 text-xs">
      <span>No se pudo validar el estado en Azure: {error}</span>
      <Button type="button" size="sm" variant="outline" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}
