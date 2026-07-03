import {
  DELIVERY_METRIC_VARIANT_STYLES,
  type VariantStyles,
} from "@/components/dashboard/metrics/delivery-metric-card.constants";
import type {
  DeliveryMetricCardProps,
  DeliveryMetricVariant,
} from "@/components/dashboard/metrics/delivery-metric-card.types";

export type DeliveryMetricCardViewModel = {
  styles: VariantStyles;
  isEmpty: boolean;
  showProgress: boolean;
  showEmptyDash: boolean;
  primaryLabel: string;
  secondaryLabel?: string;
};

export function buildDeliveryMetricCardViewModel({
  value,
  hint,
  progress,
  variant,
  loading,
}: Pick<DeliveryMetricCardProps, "value" | "hint" | "progress" | "variant" | "loading">): DeliveryMetricCardViewModel {
  const resolvedVariant: DeliveryMetricVariant = variant ?? "default";
  const isEmpty = resolvedVariant === "empty";

  return {
    styles: DELIVERY_METRIC_VARIANT_STYLES[resolvedVariant],
    isEmpty,
    showProgress: progress !== undefined && !loading,
    showEmptyDash: isEmpty && progress === undefined && !loading,
    primaryLabel: value,
    secondaryLabel: hint,
  };
}
