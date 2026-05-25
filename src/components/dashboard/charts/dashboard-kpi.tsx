import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type DashboardKpiVariant = "default" | "success" | "warning" | "accent";

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
};

export function DashboardKpi({
  label,
  value,
  hint,
  loading = false,
  progress,
  variant = "default",
  highlight = false,
  className,
}: DashboardKpiProps) {
  const styles = variantStyles[variant];
  const clampedProgress =
    progress !== undefined ? Math.min(100, Math.max(0, progress)) : undefined;

  return (
    <div
      className={cn(
        "flex min-h-[60px] flex-col justify-between rounded-lg border px-2.5 py-2 transition-colors",
        styles.border,
        styles.bg,
        highlight && "ring-1 ring-primary/20 shadow-sm",
        className,
      )}
    >
      <p className="text-muted-foreground text-[11px] font-medium leading-tight">{label}</p>
      {loading ? (
        <Skeleton className="mt-0.5 h-6 w-16" />
      ) : (
        <p
          className={cn(
            "font-heading text-lg font-semibold leading-none tracking-tight tabular-nums",
            styles.value,
          )}
        >
          {value}
        </p>
      )}
      {clampedProgress !== undefined && !loading ? (
        <div className="bg-muted/80 mt-1.5 h-1 overflow-hidden rounded-full">
          <div
            className={cn("h-full rounded-full transition-all duration-500", styles.bar)}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      ) : null}
      {hint && !loading ? (
        <p className="text-muted-foreground mt-0.5 text-[10px] leading-tight">{hint}</p>
      ) : null}
    </div>
  );
}
