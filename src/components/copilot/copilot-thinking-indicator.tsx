"use client";

import {
  CheckCircle2,
  Save,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { NeosViewIsotipoBadge } from "@/components/brand/neosview-isotipo-badge";
import type { ThinkingIconKind } from "@/lib/schemas/conversation";
import { cn } from "@/lib/utils";

type CopilotThinkingIndicatorProps = {
  label?: string;
  iconKind?: ThinkingIconKind | string;
  className?: string;
};

const STATUS_ICON_BY_KIND: Record<string, LucideIcon> = {
  thinking: Sparkles,
  search: Search,
  found: CheckCircle2,
  logging: Save,
};

/**
 * Indicador de streaming: una sola línea en muted, alineada a la izquierda
 * como cualquier respuesta del asistente. El avatar es SIEMPRE el isotipo
 * Neos (mismo que usan los mensajes del asistente) — el icono de estado
 * (`iconKind`) solo aparece al lado del label cuando hay uno, indicando
 * la fase del agente sin reemplazar la marca. Cuando no hay label, tres
 * puntos bouncing junto al avatar.
 */
export function CopilotThinkingIndicator({
  label,
  iconKind,
  className,
}: Readonly<CopilotThinkingIndicatorProps>) {
  const StatusIcon = iconKind ? STATUS_ICON_BY_KIND[iconKind] : undefined;

  return (
    <div
      className={cn(
        "text-muted-foreground motion-safe:animate-in motion-safe:fade-in flex items-center gap-2.5 py-1 text-sm",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden
        className="bg-brand-mark/10 text-brand-mark inline-flex size-6 shrink-0 items-center justify-center rounded-md"
      >
        <NeosViewIsotipoBadge className="size-3.5" />
      </span>

      {label ? (
        <>
          {StatusIcon ? (
            <StatusIcon className="size-3.5 shrink-0" aria-hidden />
          ) : null}
          <span className="text-foreground/80">{label}</span>
        </>
      ) : (
        <>
          <span className="flex items-center gap-1" aria-label="Pensando">
            <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:0ms]" />
            <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:150ms]" />
            <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:300ms]" />
          </span>
        </>
      )}
    </div>
  );
}
