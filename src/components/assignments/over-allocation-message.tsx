import { TriangleAlert } from "lucide-react";
import { Fragment } from "react";

import type { MessageSegment } from "@/lib/assignments/over-allocation";
import { cn } from "@/lib/utils";

/**
 * Renderiza un mensaje de sobreasignación resaltando los datos importantes
 * (persona, %, proyecto, equipo) marcados como `strong` en los segmentos.
 */
export function OverAllocationMessage({
  segments,
  className,
  strongClassName,
}: Readonly<{
  segments: MessageSegment[];
  className?: string;
  strongClassName?: string;
}>) {
  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.strong ? (
          <strong key={i} className={cn("font-semibold", strongClassName)}>
            {seg.text}
          </strong>
        ) : (
          <Fragment key={i}>{seg.text}</Fragment>
        ),
      )}
    </span>
  );
}

/** Caja de advertencia (colores de warning, no error) para el modal/tabla. */
export function OverAllocationWarning({
  segments,
  className,
}: Readonly<{
  segments: MessageSegment[];
  className?: string;
}>) {
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300",
        className,
      )}
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <OverAllocationMessage
        segments={segments}
        strongClassName="text-amber-900 dark:text-amber-200"
      />
    </div>
  );
}
