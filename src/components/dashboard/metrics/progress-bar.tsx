import { cn } from "@/lib/utils";

export type ProgressBarProps = {
  value: number;
  max: number;
  className?: string;
  indicatorClassName?: string;
};

function clampProgress(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

export function ProgressBar({ value, max, className, indicatorClassName }: ProgressBarProps) {
  const percent = clampProgress(value, max);

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
          "bg-primary h-full rounded-full transition-[width] duration-500 ease-out",
          indicatorClassName,
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
