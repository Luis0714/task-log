import type { DashboardKpiVariant } from "@/components/dashboard/charts/dashboard-kpi";

export type DashboardKpiVariantStyle = {
  border: string;
  bg: string;
  value: string;
  bar: string;
};

export const DASHBOARD_KPI_VARIANT_STYLES: Record<
  DashboardKpiVariant,
  DashboardKpiVariantStyle
> = {
  default: {
    border: "border-border/60",
    bg: "bg-card",
    value: "text-foreground",
    bar: "bg-primary",
  },
  primary: {
    border: "border-primary/40",
    bg: "bg-primary/10 dark:bg-primary/12",
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

/** KPI junto a ProgressRingCard: compacto en móvil, altura completa desde md */
export const DASHBOARD_KPI_FEATURED_CLASSES = {
  container:
    "flex h-full min-h-0 w-full flex-col items-center justify-center gap-1 px-2.5 py-2.5 text-center sm:gap-1.5 sm:px-3 sm:py-3 md:gap-1.5 md:px-3 md:py-4",
  label: "text-center text-[10px] sm:text-[11px]",
  value: "text-center text-lg sm:text-xl md:text-2xl lg:text-3xl",
  skeleton: "mx-auto h-6 w-20 sm:h-7 sm:w-24 md:h-8 md:w-28",
  progressBarWrapper: "mx-auto w-full max-w-[9rem] sm:max-w-[10rem] md:max-w-48",
  progressBarMargin: "mt-0.5 sm:mt-1 md:mt-0.5",
} as const;
