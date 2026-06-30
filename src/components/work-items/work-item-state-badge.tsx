"use client";

import { usePbiStateColors } from "@/hooks/use-pbi-state-colors";
import { cn } from "@/lib/utils";

export type WorkItemStateBadgeProps = {
  state: string;
  className?: string;
};

export function WorkItemStateBadge({ state, className }: WorkItemStateBadgeProps) {
  const { category, badgeStyle, dotStyle } = usePbiStateColors(state);
  // `badgeStyle.color` se calcula por luminancia del color del estado y no
  // respeta el tema: en dark mode, estados con color claro dejaban el texto
  // casi negro sobre fondo oscuro. Lo descartamos y usamos el foreground del
  // tema (vía `text-foreground`) para garantizar contraste en ambos temas; el
  // fondo tintado (~10% alpha) es lo bastante sutil para que esto siga
  // siendo legible. `badgeStyle` sigue intacto para exports (imagen/PDF).
  const { color: _ignored, ...surfaceStyle } = badgeStyle;

  return (
    <span
      data-pbi-state={category}
      style={surfaceStyle}
      className={cn(
        "text-foreground inline-flex min-w-0 max-w-[58%] shrink items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        className,
      )}
    >
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={dotStyle}
        aria-hidden
      />
      <span className="truncate">{state}</span>
    </span>
  );
}
