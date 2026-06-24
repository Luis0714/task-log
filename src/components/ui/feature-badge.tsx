import { Badge, type badgeVariants } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export type FeatureBadgeVariant = Extract<BadgeVariant, "new" | "plan">;

export type FeatureBadgeProps = Readonly<{
  /**
   * Variante semántica:
   * - `new`  → resalta funcionalidades recién publicadas (etiqueta "New").
   * - `plan` → resalta funcionalidades reservadas a un plan concreto
   *            (etiqueta "Plan", útil para futuros gates comerciales).
   */
  variant: FeatureBadgeVariant;
  /**
   * Texto a mostrar. Por defecto `New` para `new` y `Plan` para `plan`.
   */
  label?: string;
  className?: string;
  /**
   * Si `true`, el badge se posiciona de forma absoluta en la esquina
   * superior derecha del contenedor padre (que debe tener `position: relative`).
   * Por defecto `false` (estilo inline, junto al label).
   */
  floating?: boolean;
}>;

const DEFAULT_LABELS: Record<FeatureBadgeVariant, string> = {
  new: "New",
  plan: "Plan",
};

const FLOATING_POSITION_CLASSES =
  "pointer-events-none absolute -top-1.5 -right-1.5 z-10 h-4 rounded-full px-1.5 text-[0.6rem] font-semibold uppercase tracking-wider shadow-sm ring-1 ring-background";

/**
 * Badge semántico para destacar estado de una funcionalidad:
 * - "New" para features recién lanzadas (variante `new`).
 * - "Plan" para funcionalidades sujetas a un plan futuro (variante `plan`).
 *
 * Variantes de color viven en `src/components/ui/badge.tsx` (`new`, `plan`).
 *
 * Con `floating` se posiciona absoluto en la esquina superior derecha del
 * contenedor padre, estilo sticker.
 */
export function FeatureBadge({
  variant,
  label,
  className,
  floating = false,
}: FeatureBadgeProps) {
  const resolvedLabel = label ?? DEFAULT_LABELS[variant];
  return (
    <Badge
      variant={variant}
      className={cn(
        "px-1.5 py-0 text-[0.625rem] font-semibold uppercase tracking-wide",
        variant === "new" && "animate-feature-badge-glow",
        floating && FLOATING_POSITION_CLASSES,
        className,
      )}
    >
      {resolvedLabel}
    </Badge>
  );
}
