import { cn } from "@/lib/utils";

export type ProgressBarProps = {
  value: number;
  max: number;
  className?: string;
  indicatorClassName?: string;
};

type ProgressStatus = "in-progress" | "complete" | "over";

function clampProgress(value: number, max: number): number {
  if (max <= 0) return value > 0 ? 100 : 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

function resolveProgressStatus(value: number, max: number): ProgressStatus {
  if (max <= 0) return value > 0 ? "over" : "in-progress";
  if (value > max) return "over";
  if (value >= max) return "complete";
  return "in-progress";
}

const INDICATOR_STATUS_CLASS: Record<ProgressStatus, string> = {
  "in-progress": "bg-primary",
  complete: "bg-emerald-500",
  over: "bg-destructive",
};

export function ProgressBar({ value, max, className, indicatorClassName }: ProgressBarProps) {
  const percent = clampProgress(value, max);
  const status = resolveProgressStatus(value, max);

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("bg-muted h-1.5 w-full overflow-hidden rounded-full", className)}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          INDICATOR_STATUS_CLASS[status],
          indicatorClassName,
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
