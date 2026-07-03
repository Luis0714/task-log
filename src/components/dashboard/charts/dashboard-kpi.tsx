import { HoursBreakdownStrip } from "@/components/dashboard/charts/hours-breakdown-strip";
import { DASHBOARD_KPI_VARIANT_STYLES } from "@/components/dashboard/charts/dashboard-kpi.constants";
import { DashboardKpiProgress } from "@/components/dashboard/charts/dashboard-kpi-progress";
import { buildDashboardKpiViewModel } from "@/components/dashboard/charts/dashboard-kpi.viewmodel";
import { Skeleton } from "@/components/ui/skeleton";
import type { HoursBreakdown } from "@/lib/dashboard/hours-breakdown";
import { cn } from "@/lib/utils";

export type DashboardKpiVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "accent"
  | "destructive";

export type DashboardKpiSize = "default" | "compact" | "featured";

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
  labelClassName?: string;
  valueClassName?: string;
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
  labelClassName,
  valueClassName,
}: DashboardKpiProps) {
  const styles = DASHBOARD_KPI_VARIANT_STYLES[variant];
  const viewModel = buildDashboardKpiViewModel({
    progress,
    size,
    layout,
    hoursBreakdown,
    hint,
    variant,
    highlight,
  });

  const progressBar =
    viewModel.clampedProgress !== undefined && !loading ? (
      <DashboardKpiProgress
        value={viewModel.clampedProgress}
        barClassName={styles.bar}
        heightClassName={viewModel.progressBarHeightClass}
        marginClassName={viewModel.progressBarMarginClass}
      />
    ) : null;

  const breakdownEl =
    hoursBreakdown && !loading ? (
      <HoursBreakdownStrip
        breakdown={hoursBreakdown}
        showWhenEmpty
        pendingHours={hoursPending}
        className={cn(
          viewModel.inline ? "mt-0.5" : viewModel.featured || viewModel.compact ? "mt-0.5" : "mt-1",
        )}
      />
    ) : null;

  const hintEl =
    hint && !loading ? (
      <p
        className={cn(
          "text-muted-foreground leading-tight",
          viewModel.featured ? "max-w-full" : "truncate",
          viewModel.hintClassName,
        )}
      >
        {hint}
      </p>
    ) : null;

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border transition-colors",
        viewModel.containerSpacingClass,
        styles.border,
        styles.bg,
        viewModel.highlightClassName,
        className,
      )}
    >
      {viewModel.inline ? (
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
              viewModel.featuredLabelClass,
              viewModel.compact && !viewModel.featured ? "line-clamp-2 text-[10px]" : null,
              !viewModel.featured && !viewModel.compact ? "text-[11px]" : null,
              labelClassName,
            )}
          >
            {label}
          </p>
          {loading ? (
            <Skeleton
              className={cn(
                viewModel.featuredSkeletonClass,
                !viewModel.featured && viewModel.compact ? "mt-0 h-5 w-12" : null,
                !viewModel.featured && !viewModel.compact ? "mt-0.5 h-6 w-16" : null,
                valueClassName,
              )}
            />
          ) : (
            <p
              className={cn(
                "font-heading font-semibold leading-none tracking-tight tabular-nums",
                viewModel.featuredValueClass,
                viewModel.compact && !viewModel.featured ? "text-base" : null,
                !viewModel.featured && !viewModel.compact ? "text-lg" : null,
                styles.value,
                valueClassName,
              )}
            >
              {value}
            </p>
          )}
          {progressBar ? (
            <div className={viewModel.featuredProgressBarWrapperClass}>{progressBar}</div>
          ) : null}
          {breakdownEl}
          {hintEl}
        </>
      )}
    </div>
  );
}
