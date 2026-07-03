import { cn } from "@/lib/utils";

export type WorkItemBacklogBadgeProps = {
  className?: string;
};

export function WorkItemBacklogBadge({ className }: WorkItemBacklogBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-300",
        className,
      )}
      title="Historia del backlog con trabajo registrado en el periodo del sprint"
    >
      Backlog
    </span>
  );
}
