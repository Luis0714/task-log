import { HoursBreakdownStrip } from "@/components/dashboard/charts/hours-breakdown-strip";
import { Skeleton } from "@/components/ui/skeleton";
import type { HoursBreakdown } from "@/lib/dashboard/hours-breakdown";
import { cn } from "@/lib/utils";

export type DashboardKpiVariant =
  | "default"
  | "success"
  | "warning"
  | "accent"
  | "destructive";

export type DashboardKpiSize = "default" | "compact";

export type DashboardKpiLayout = "stack" | "inline";

export type DashboardKpiProps = {
  label: string;
  value: string;
  hint?: string;
  loading?: boolean;
  /** 0–100: barra de progreso bajo el valor */
  progress?: number;
  variant?: DashboardKpiVariant;
  /** Borde y fondo más visibles para métricas clave */
  highlight?: boolean;
  size?: DashboardKpiSize;
  /** inline: etiqueta y valor en una fila (más bajo y estrecho) */
  layout?: DashboardKpiLayout;
  /** Desglose task / bug (barra + horas) bajo la barra de progreso */
  hoursBreakdown?: HoursBreakdown;
  /** Horas pendientes mostradas junto al desglose task/bug */
  hoursPending?: number;
  className?: string;
};

const variantStyles: Record<
  DashboardKpiVariant,
  { border: string; bg: string; value: string; bar: string }
> = {
  default: {
    border: "border-border/60",
    bg: "bg-card",
    value: "text-foreground",
    bar: "bg-primary",
  },
  success: {
    border: "border-emerald-500/35",
    bg: "bg-emerald-500/8 dark:bg-emerald-500/12",
    value: "text-emerald-700 dark:text-emerald-400",
    bar: "bg-emerald-500",
  },
  warning: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/8 dark:bg-amber-500/12",
    value: "text-amber-700 dark:text-amber-400",
    bar: "bg-amber-500",
  },
  accent: {
    border: "border-primary/35",
    bg: "bg-primary/8",
    value: "text-primary",
    bar: "bg-primary",
  },
  destructive: {
    border: "border-destructive/40",
    bg: "bg-destructive/8 dark:bg-destructive/12",
    value: "text-destructive",
    bar: "bg-destructive",
  },
};

export function DashboardKpi({
  label,
  value,
  hint,
  loading = false,
  progress,
  variant = "default",
  highlight = false,
  size = "default",
  layout = "stack",
  hoursBreakdown,
  hoursPending,
  className,
}: DashboardKpiProps) {
  const styles = variantStyles[variant];
  const compact = size === "compact";
  const inline = layout === "inline";
  const clampedProgress =
    progress !== undefined ? Math.min(100, Math.max(0, progress)) : undefined;

  const progressBar =
    clampedProgress !== undefined && !loading ? (
      <div
        className={cn(
          "bg-muted/80 w-full overflow-hidden rounded-full",
          compact || inline ? "h-0.5" : "mt-1.5 h-1",
          inline && !hint ? "mt-1" : inline && hint ? "mt-0.5" : compact ? "mt-0.5" : undefined,
        )}
      >
        <div
          className={cn("h-full rounded-full transition-all duration-500", styles.bar)}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    ) : null;

  const breakdownEl =
    hoursBreakdown && !loading ? (
      <HoursBreakdownStrip
        breakdown={hoursBreakdown}
        showWhenEmpty
        pendingHours={hoursPending}
        className={cn(inline ? "mt-0.5" : compact ? "mt-0.5" : "mt-1")}
      />
    ) : null;

  const hintEl =
    hint && !loading ? (
      <p
        className={cn(
          "text-muted-foreground truncate leading-tight",
          compact || inline ? "text-[9px]" : "mt-0.5 text-[10px]",
        )}
      >
        {hint}
      </p>
    ) : null;

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border transition-colors",
        inline
          ? "gap-1 px-2 py-1.5"
          : compact
            ? "min-h-0 justify-between gap-0.5 px-2 py-1.5"
            : "min-h-[52px] justify-between gap-0 px-2.5 py-2",
        styles.border,
        styles.bg,
        highlight &&
          (variant === "destructive"
            ? "shadow-sm ring-1 ring-destructive/25"
            : "shadow-sm ring-1 ring-primary/20"),
        className,
      )}
    >
      {inline ? (
        <>
          <div className="flex min-w-0 items-baseline justify-between gap-2">
            <p className="text-muted-foreground min-w-0 truncate text-[10px] font-medium leading-tight">
              {label}
            </p>
            {loading ? (
              <Skeleton className="h-5 w-14 shrink-0" />
            ) : (
              <p
                className={cn(
                  "font-heading shrink-0 text-right text-sm font-semibold leading-none tracking-tight tabular-nums",
                  styles.value,
                )}
              >
                {value}
              </p>
            )}
          </div>
          {progressBar}
          {breakdownEl}
          {hintEl}
        </>
      ) : (
        <>
          <p
            className={cn(
              "text-muted-foreground font-medium leading-tight",
              compact ? "line-clamp-2 text-[10px]" : "text-[11px]",
            )}
          >
            {label}
          </p>
          {loading ? (
            <Skeleton className={cn(compact ? "mt-0 h-5 w-12" : "mt-0.5 h-6 w-16")} />
          ) : (
            <p
              className={cn(
                "font-heading font-semibold leading-none tracking-tight tabular-nums",
                compact ? "text-base" : "text-lg",
                styles.value,
              )}
            >
              {value}
            </p>
          )}
          {progressBar}
          {breakdownEl}
          {hintEl}
        </>
      )}
    </div>
  );
}
