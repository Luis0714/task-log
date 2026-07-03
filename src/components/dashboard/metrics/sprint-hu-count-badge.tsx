import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type SprintHuCountBadgeProps = {
  count: number;
  className?: string;
};

export function SprintHuCountBadge({ count, className }: SprintHuCountBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-5 gap-1 border-amber-500/40 bg-amber-500/8 px-2 text-[10px] font-medium text-amber-700 dark:bg-amber-500/12 dark:text-amber-400",
        className,
      )}
    >
      <span>HUs asignadas</span>
      <span className="font-bold tabular-nums">{count}</span>
    </Badge>
  );
}
