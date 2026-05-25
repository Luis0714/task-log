import {
  clampProgressPercent,
  PROGRESS_BAR_CLASS,
  resolveProgressStatus,
} from "@/lib/dashboard/progress-status";
import { cn } from "@/lib/utils";

export type ProgressBarProps = {
  value: number;
  max: number;
  className?: string;
  indicatorClassName?: string;
};

export function ProgressBar({ value, max, className, indicatorClassName }: ProgressBarProps) {
  const percent = clampProgressPercent(value, max);
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
          PROGRESS_BAR_CLASS[status],
          indicatorClassName,
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
