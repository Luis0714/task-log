import type { DeliveryMetricVariant } from "@/components/dashboard/metrics/delivery-metric-card.types";

export type VariantStyles = {
  border: string;
  bg: string;
  icon: string;
  value: string;
  bar: string;
  ring: string;
};

export const DELIVERY_METRIC_VARIANT_STYLES: Record<DeliveryMetricVariant, VariantStyles> = {
  default: {
    border: "border-border/70",
    bg: "bg-card",
    icon: "text-primary",
    value: "text-foreground",
    bar: "bg-primary",
    ring: "ring-primary/20",
  },
  primary: {
    border: "border-primary/40",
    bg: "bg-primary/10 dark:bg-primary/12",
    icon: "text-primary",
    value: "text-foreground",
    bar: "bg-primary",
    ring: "ring-primary/30",
  },
  success: {
    border: "border-emerald-500/35",
    bg: "bg-emerald-500/8 dark:bg-emerald-500/12",
    icon: "text-[var(--bug-attended)]",
    value: "text-[var(--bug-attended)]",
    bar: "bg-[var(--bug-attended)]",
    ring: "ring-emerald-500/25",
  },
  warning: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/8 dark:bg-amber-500/12",
    icon: "text-amber-600 dark:text-amber-400",
    value: "text-amber-700 dark:text-amber-400",
    bar: "bg-amber-500",
    ring: "ring-amber-500/25",
  },
  accent: {
    border: "border-accent/40",
    bg: "bg-accent/10 dark:bg-accent/12",
    icon: "text-accent",
    value: "text-accent",
    bar: "bg-accent",
    ring: "ring-accent/30",
  },
  empty: {
    border: "border-border/60",
    bg: "bg-muted/30",
    icon: "text-muted-foreground/70",
    value: "text-muted-foreground",
    bar: "bg-muted-foreground/30",
    ring: "ring-border/40",
  },
  bugOpen: {
    border: "border-bug-open/40",
    bg: "bg-bug-open/10 dark:bg-bug-open/12",
    icon: "text-bug-open",
    value: "text-foreground",
    bar: "bg-bug-open",
    ring: "ring-bug-open/30",
  },
  destructive: {
    border: "border-destructive/40",
    bg: "bg-destructive/8 dark:bg-destructive/12",
    icon: "text-destructive",
    value: "text-destructive",
    bar: "bg-destructive",
    ring: "ring-destructive/25",
  },
};
