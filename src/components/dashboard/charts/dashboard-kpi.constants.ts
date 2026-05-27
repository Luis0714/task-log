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
