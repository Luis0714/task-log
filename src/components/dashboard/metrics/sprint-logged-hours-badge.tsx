import { Badge } from "@/components/ui/badge";
import { formatHours } from "@/lib/dashboard/format-hours";
import { cn } from "@/lib/utils";

export type SprintLoggedHoursBadgeProps = {
  hours: number;
  className?: string;
};

export function SprintLoggedHoursBadge({ hours, className }: SprintLoggedHoursBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 gap-1 border-sky-500/40 bg-sky-500/8 px-2 text-[10px] font-medium text-sky-800 dark:bg-sky-500/12 dark:text-sky-300",
        className,
      )}
    >
      <span>Total horas</span>
      <span className="font-bold tabular-nums">{formatHours(hours)}</span>
    </Badge>
  );
}
