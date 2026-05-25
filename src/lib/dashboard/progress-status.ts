export type ProgressStatus = "in-progress" | "complete" | "over";

export function clampProgressPercent(value: number, max: number): number {
  if (max <= 0) return value > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

export function resolveProgressStatus(value: number, max: number): ProgressStatus {
  if (max <= 0) return value > 0 ? "over" : "in-progress";
  if (value > max) return "over";
  if (value >= max) return "complete";
  return "in-progress";
}

export const PROGRESS_BAR_CLASS: Record<ProgressStatus, string> = {
  "in-progress": "bg-primary",
  complete: "bg-emerald-500",
  over: "bg-destructive",
};
