import { WorkItemHoursLabel } from "@/components/work-items/work-item-hours-label";
import { WorkItemId } from "@/components/work-items/work-item-id";
import { WorkItemPriorityBadge } from "@/components/work-items/work-item-priority-badge";
import { TaskDateBadge } from "@/components/tasks/task-date-badge";
import { StatusBadge } from "@/components/tasks/status-badge";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { cn } from "@/lib/utils";

export type SprintItemRowProps = {
  item: AdoWorkItemOptionDto;
  showHours?: boolean;
  className?: string;
  onClick?: () => void;
};

export function SprintItemRow({
  item,
  showHours = true,
  className,
  onClick,
}: SprintItemRowProps) {
  const content = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <WorkItemId id={item.id} />
          {item.workingDate ? <TaskDateBadge dateKey={item.workingDate} /> : null}
          {item.priority !== undefined ? (
            <WorkItemPriorityBadge priority={item.priority} />
          ) : null}
        </div>
        <p className="text-foreground mt-0.5 truncate text-sm font-medium" title={item.title}>
          {item.title}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
        {showHours && item.loggedHours !== undefined ? (
          <WorkItemHoursLabel hours={item.loggedHours} suffix="" className="text-xs" />
        ) : null}
        {item.state ? <StatusBadge state={item.state} className="max-w-30" /> : null}
      </div>
    </>
  );

  const rowClassName = cn(
    "flex w-full min-w-0 items-center gap-3 rounded-lg border border-transparent px-3 py-2.5",
    "transition-colors hover:border-border/60 hover:bg-muted/40",
    onClick && "cursor-pointer",
    className,
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(rowClassName, "text-left")}>
        {content}
      </button>
    );
  }

  return <div className={rowClassName}>{content}</div>;
}
