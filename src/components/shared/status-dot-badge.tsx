import { cn } from "@/lib/utils";

export type StatusDotBadgeProps = {
  label: string;
  className?: string;
  dotClassName?: string;
};

export function StatusDotBadge({
  label,
  className,
  dotClassName,
}: StatusDotBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", dotClassName)} aria-hidden />
      <span className="truncate">{label}</span>
    </span>
  );
}
