import { Badge } from "@/components/ui/badge";
import type { NewsStoryValidationEntry } from "@/lib/news-stories/types";

export type LinkedValidationBadgeProps = Readonly<{
  validation: NewsStoryValidationEntry | undefined;
}>;

/**
 * Badge que marca el estado de validación contra Azure de una HU vinculada.
 * - `active` / sin validación: se omite (la fila muestra el state badge normal).
 * - `deleted` en Azure: rojo "Eliminada en Azure".
 * - `renamed` en Azure: pill "Renombrada".
 */
export function LinkedValidationBadge({
  validation,
}: LinkedValidationBadgeProps) {
  if (!validation || validation.status === "active") return null;
  if (validation.status === "deleted") {
    return (
      <Badge variant="destructive" className="shrink-0">
        Eliminada en Azure
      </Badge>
    );
  }
  return (
    <Badge variant="plan" className="shrink-0">
      Renombrada
    </Badge>
  );
}
