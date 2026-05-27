import type {
  DashboardKpiLayout,
  DashboardKpiSize,
  DashboardKpiVariant,
} from "@/components/dashboard/charts/dashboard-kpi";

export type DashboardKpiViewModel = {
  compact: boolean;
  inline: boolean;
  clampedProgress?: number;
  hasHoursBreakdown: boolean;
  progressBarHeightClass: string;
  progressBarMarginClass: string;
  hintClassName: string;
  containerSpacingClass: string;
  highlightClassName?: string;
};

function resolveProgressBarMarginClass({
  hasHoursBreakdown,
  compact,
  inline,
  hasHint,
}: {
  hasHoursBreakdown: boolean;
  compact: boolean;
  inline: boolean;
  hasHint: boolean;
}) {
  if (hasHoursBreakdown) return compact ? "mt-0.5" : "mt-1.5";
  if (inline && !hasHint) return "mt-1";
  if (inline && hasHint) return "mt-0.5";
  if (compact) return "mt-0.5";
  return "mt-1.5";
}

function resolveHighlightClassName(variant: DashboardKpiVariant, highlight: boolean) {
  if (!highlight) return undefined;
  if (variant === "destructive") return "shadow-sm ring-1 ring-destructive/25";
  if (variant === "primary") return "shadow-sm ring-1 ring-primary/30";
  return "shadow-sm ring-1 ring-primary/20";
}

export function buildDashboardKpiViewModel({
  progress,
  size,
  layout,
  hoursBreakdown,
  hint,
  variant,
  highlight,
}: {
  progress?: number;
  size: DashboardKpiSize;
  layout: DashboardKpiLayout;
  hoursBreakdown?: unknown;
  hint?: string;
  variant: DashboardKpiVariant;
  highlight: boolean;
}): DashboardKpiViewModel {
  const compact = size === "compact";
  const inline = layout === "inline";
  const hasHoursBreakdown = Boolean(hoursBreakdown);
  const clampedProgress =
    progress !== undefined ? Math.min(100, Math.max(0, progress)) : undefined;

  return {
    compact,
    inline,
    clampedProgress,
    hasHoursBreakdown,
    progressBarHeightClass:
      hasHoursBreakdown ? "h-2" : compact || inline ? "h-1" : "h-2",
    progressBarMarginClass: resolveProgressBarMarginClass({
      hasHoursBreakdown,
      compact,
      inline,
      hasHint: Boolean(hint),
    }),
    hintClassName: compact || inline ? "text-[9px]" : "mt-0.5 text-[10px]",
    containerSpacingClass: inline
      ? "gap-1 px-2 py-1.5"
      : compact
        ? "min-h-0 justify-between gap-0.5 px-2 py-1.5"
        : "min-h-[52px] justify-between gap-0 px-2.5 py-2",
    highlightClassName: resolveHighlightClassName(variant, highlight),
  };
}
