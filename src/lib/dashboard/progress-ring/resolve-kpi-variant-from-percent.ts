import type { ProgressRingKpiViewModel } from "@/lib/dashboard/progress-ring/types";

export function resolveKpiVariantFromPercent(
  percent: number,
): ProgressRingKpiViewModel["variant"] {
  if (percent >= 75) return "success";
  if (percent >= 40) return "warning";
  return "default";
}
