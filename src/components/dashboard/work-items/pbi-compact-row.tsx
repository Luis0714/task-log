import { WorkItemAssigneeTag } from "@/components/work-items/work-item-assignee-tag";
import { WorkItemBacklogBadge } from "@/components/work-items/work-item-backlog-badge";
import { WorkItemHoursLabel } from "@/components/work-items/work-item-hours-label";
import { WorkItemId } from "@/components/work-items/work-item-id";
import { WorkItemBugCountBadge } from "@/components/work-items/work-item-bug-count-badge";
import { WorkItemEffortBadge } from "@/components/work-items/work-item-effort-badge";
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
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          <WorkItemId id={item.id} className="shrink-0" />
          {item.fromBacklog ? <WorkItemBacklogBadge className="shrink-0" /> : null}
          {item.effort !== undefined ? (
            <WorkItemEffortBadge effort={item.effort} className="shrink-0" />
          ) : null}
          {item.bugCount !== undefined && item.bugCount > 0 ? (
            <WorkItemBugCountBadge count={item.bugCount} variant="total" className="shrink-0" />
          ) : null}
          {item.attendedBugCount !== undefined && item.attendedBugCount > 0 ? (
            <WorkItemBugCountBadge
              count={item.attendedBugCount}
              variant="attended"
              className="shrink-0"
            />
          ) : null}
          {item.assignedTo || item.state ? (
            <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 overflow-hidden">
              {item.assignedTo ? (
                <WorkItemAssigneeTag
                  name={item.assignedTo}
                  className="max-w-36 sm:max-w-44"
                  hideAvatar
                />
              ) : null}
              {item.state ? (
                <WorkItemStateBadge state={item.state} className="max-w-30 shrink-0" />
              ) : null}
            </div>
          ) : null}
        </div>
        <p className="text-foreground mt-0.5 truncate text-sm font-medium" title={item.title}>
          {item.title}
        </p>
        {showHours && item.loggedHours !== undefined ? (
          <WorkItemHoursLabel hours={item.loggedHours} suffix="" className="mt-1 text-xs" />
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
