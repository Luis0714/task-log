import type { DeliveryMetricVariant } from "@/components/dashboard/metrics/delivery-metric-card";
import type { WorkItemStatusCounts } from "@/lib/dashboard/types";
import { kpiVariantFromProgress } from "@/lib/dashboard/kpi-variant";

export function resolveUserStoriesMetricVariant(
  counts: WorkItemStatusCounts,
  percent: number,
): DeliveryMetricVariant {
  if (counts.assigned <= 0) return "empty";

  const base = kpiVariantFromProgress(counts.completed, counts.assigned);
  if (base === "destructive") return "destructive";
  if (percent >= 75) return "success";
  if (counts.pending > 0 && percent < 50) return "warning";
  return "primary";
}

export function resolveBugsMetricVariant(
  counts: WorkItemStatusCounts,
  percent: number,
): DeliveryMetricVariant {
  if (counts.assigned <= 0) return "success";
  const base = kpiVariantFromProgress(counts.completed, counts.assigned);
  if (base === "destructive") return "destructive";
  if (counts.pending === 0) return "success";
  if (percent > 0 && percent < 100) return "bugOpen";
  return "default";
}

export function resolveStoryPointsMetricVariant(points: number): DeliveryMetricVariant {
  return points > 0 ? "accent" : "empty";
}
