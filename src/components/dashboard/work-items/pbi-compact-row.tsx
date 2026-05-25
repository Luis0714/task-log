import { WorkItemHoursLabel } from "@/components/work-items/work-item-hours-label";
import { WorkItemId } from "@/components/work-items/work-item-id";
import { WorkItemBugCountBadge } from "@/components/work-items/work-item-bug-count-badge";
import { WorkItemEffortBadge } from "@/components/work-items/work-item-effort-badge";
import { WorkItemPriorityBadge } from "@/components/work-items/work-item-priority-badge";
import { WorkItemStateBadge } from "@/components/work-items/work-item-state-badge";
import { WorkItemTypeAvatar } from "@/components/work-items/work-item-type-avatar";
import type { DashboardWorkItem } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

export type PbiCompactRowProps = {
  item: DashboardWorkItem;
  showHours?: boolean;
  className?: string;
  onClick?: () => void;
};

export function PbiCompactRow({
  item,
  showHours = false,
  className,
  onClick,
}: PbiCompactRowProps) {
  const content = (
    <>
      <WorkItemTypeAvatar type={item.type} size="sm" className="hidden sm:flex" />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <WorkItemId id={item.id} />
          {item.priority !== undefined ? (
            <WorkItemPriorityBadge priority={item.priority} />
          ) : null}
          {item.effort !== undefined ? <WorkItemEffortBadge effort={item.effort} /> : null}
          {item.bugCount !== undefined && item.bugCount > 0 ? (
            <WorkItemBugCountBadge count={item.bugCount} variant="total" />
          ) : null}
          {item.attendedBugCount !== undefined && item.attendedBugCount > 0 ? (
            <WorkItemBugCountBadge count={item.attendedBugCount} variant="attended" />
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
        {item.state ? (
          <WorkItemStateBadge state={item.state} className="max-w-[7.5rem]" />
        ) : null}
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
