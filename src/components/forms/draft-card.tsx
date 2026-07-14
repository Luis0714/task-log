"use client";

import type { ReactNode } from "react";
import { ChevronDown, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export type DraftCardVariant = "default" | "error" | "success";

export type DraftCardProps = Readonly<{
  /** Identificador único de la fila. */
  id: string;
  /** Índice 0-based que se muestra como "#N". */
  index: number;
  /** Estado controlado (abierto/cerrado). */
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Contenido visible cuando la fila está colapsada (header). */
  summary: ReactNode;
  /** Contenido del body (campos del form). */
  children: ReactNode;
  /** Chip opcional a la derecha del header (estado, error, etc.). */
  status?: ReactNode;
  /** Estado visual del borde. */
  variant?: DraftCardVariant;
  canRemove?: boolean;
  onRemove?: () => void;
  disabled?: boolean;
  /** aria-label del trigger; default = "Fila N". */
  triggerLabel?: string;
}>;

/**
 * Card colapsable genérico para listas de "borradores" o "ítems a confirmar".
 *
 * Una sola fila debe estar abierta a la vez — el control de `isOpen` vive en
 * el padre (hook de estado). Este componente es presentacional: no conoce el
 * dominio, lo que lo hace reusable desde `time-log/bulk` y, en el futuro,
 * desde `neos-ia` cuando el agente quiera confirmar tareas.
 *
 * Animación: grid-template-rows 0fr ↔ 1fr (CSS-only) usando los data attrs
 * que expone `@base-ui/react/collapsible` (data-open / data-closed / data-panel).
 */
export function DraftCard({
  id,
  index,
  isOpen,
  onOpenChange,
  summary,
  children,
  status,
  variant = "default",
  canRemove = true,
  onRemove,
  disabled = false,
  triggerLabel,
}: DraftCardProps) {
  const variantClass = {
    default: "border-border/60 bg-card",
    error: "border-destructive/40 bg-destructive/5",
    success: "border-emerald-500/30 bg-card",
  }[variant];

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={onOpenChange}
      disabled={disabled}
      className={cn(
        "rounded-lg border transition-colors",
        variantClass,
      )}
    >
      {/* Header — el trigger controla apertura/cierre. */}
      <div className="flex items-stretch justify-between gap-2">
        <CollapsibleTrigger
          aria-label={triggerLabel ?? `Fila ${index + 1}`}
          disabled={disabled}
          className={cn(
            "group flex min-w-0 flex-1 items-center gap-3 rounded-l-lg px-3 py-2.5 text-left",
            "hover:bg-accent/30 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "text-muted-foreground shrink-0 transition-transform",
              isOpen && "rotate-0",
              !isOpen && "-rotate-90",
            )}
          >
            <ChevronDown className="size-4" />
          </span>
          <span
            aria-hidden
            className="text-muted-foreground shrink-0 text-sm font-semibold tabular-nums"
          >
            #{index + 1}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm">{summary}</span>
          {status ? (
            <span
              className="shrink-0"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.stopPropagation();
                }
              }}
            >
              {status}
            </span>
          ) : null}
        </CollapsibleTrigger>

        {onRemove ? (
          <div className="flex items-center pr-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Eliminar fila ${index + 1}`}
              onClick={onRemove}
              disabled={!canRemove || disabled}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 aria-hidden />
            </Button>
          </div>
        ) : null}
      </div>

      {/* Body con animación CSS grid-template-rows. */}
      <CollapsibleContent
        // Identificador para que aria-controls apunte aquí si la lib lo requiere.
        id={`draft-card-${id}-panel`}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          "data-open:grid-rows-[1fr] data-closed:grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "space-y-3 border-t p-3",
              variant === "default" && "border-border/60",
              variant === "error" && "border-destructive/30",
              variant === "success" && "border-emerald-500/30",
            )}
          >
            {children}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
