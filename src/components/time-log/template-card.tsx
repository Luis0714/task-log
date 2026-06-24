"use client";

import { Check, Sparkles } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TimeLogTemplateDto } from "@/lib/schemas/time-log-template";

type BadgeVariant = "role" | "global" | "personal";

export function badgeForTemplate(
  template: TimeLogTemplateDto,
): { label: string; variant: BadgeVariant } {
  if (!template.isSystem) return { label: "Personal", variant: "personal" };
  if (template.seedKey === "global") return { label: "Global", variant: "global" };
  return { label: "Tu rol", variant: "role" };
}

export function TemplateCardBadge({
  variant,
  label,
}: {
  variant: BadgeVariant;
  label: string;
}) {
  return (
    <span
      className={cn(
        "text-[9px] tracking-wide uppercase",
        variant === "personal" ? "text-muted-foreground" : "text-primary/70",
      )}
    >
      {label}
    </span>
  );
}

export type TemplateCardProps = Readonly<{
  template: TimeLogTemplateDto;
  selected: boolean;
  onSelect: () => void;
  onClear: () => void;
  disabled?: boolean;
}>;

/**
 * Card visual de una plantilla (compacta, con badge y estado seleccionado).
 * Se usa tanto en el selector Individual como en el selector por fila de Múltiple.
 */
export function TemplateCard({
  template,
  selected,
  onSelect,
  onClear,
  disabled = false,
}: TemplateCardProps) {
  const { label, variant } = badgeForTemplate(template);
  return (
    <div
      className={cn(
        "flex w-32 shrink-0 flex-col rounded-md border transition",
        "hover:border-primary",
        selected
          ? "border-primary bg-primary/5 ring-primary/30 ring-2"
          : "border-border bg-card",
      )}
    >
      <button
        type="button"
        onClick={selected ? onClear : onSelect}
        aria-pressed={selected}
        aria-label={`${template.name} (${label})`}
        disabled={disabled}
        className={cn(
          "flex flex-col items-start gap-0.5 rounded-md px-2.5 py-1.5 text-left",
          "hover:bg-primary/5 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <div className="flex w-full items-center justify-between gap-1">
          <span className="truncate text-xs font-medium leading-tight">
            {template.name}
          </span>
          {selected ? (
            <Check className="text-primary size-3 shrink-0" aria-hidden />
          ) : (
            <Sparkles
              className="text-muted-foreground size-3 shrink-0"
              aria-hidden
            />
          )}
        </div>
        <TemplateCardBadge variant={variant} label={label} />
      </button>
    </div>
  );
}

export function TemplatesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1"
      style={{ scrollbarWidth: "thin" }}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <Skeleton key={idx} className="h-14 w-32 shrink-0" />
      ))}
    </div>
  );
}
