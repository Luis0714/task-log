import {
  clampProgressPercent,
  resolveProgressStatus,
  type ProgressStatus,
} from "@/lib/dashboard/progress-status";

export type KpiVariant = "default" | "success" | "warning" | "accent" | "destructive";

export function kpiVariantFromProgress(
  value: number,
  max: number,
  options?: { lowProgress?: boolean },
): KpiVariant {
  const status = resolveProgressStatus(value, max);
  if (status === "over") return "destructive";
  if (status === "complete") return "success";
  if (options?.lowProgress) return "warning";
  return "default";
}

export function kpiProgressPercent(value: number, max: number): number {
  return Math.round(clampProgressPercent(value, max));
}

export { resolveProgressStatus, type ProgressStatus };
