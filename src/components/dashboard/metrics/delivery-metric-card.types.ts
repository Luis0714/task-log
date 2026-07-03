import type { LucideIcon } from "lucide-react";

export type DeliveryMetricVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "accent"
  | "empty"
  | "bugOpen"
  | "destructive";

export type DeliveryMetricCardProps = {
  title: string;
  icon: LucideIcon;
  value: string;
  hint?: string;
  /** 0–100; omit for empty / story-points cards */
  progress?: number;
  variant?: DeliveryMetricVariant;
  highlight?: boolean;
  loading?: boolean;
  /** Sobrescribe el color del icono (p. ej. `text-bug-open`). */
  iconClassName?: string;
  className?: string;
};
