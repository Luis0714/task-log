import { UserRound } from "lucide-react";

import { WorkItemAssigneeTag } from "@/components/work-items/work-item-assignee-tag";
import { WorkItemEffortBadge } from "@/components/work-items/work-item-effort-badge";
import { WorkItemId } from "@/components/work-items/work-item-id";
import { WorkItemPriorityBadge } from "@/components/work-items/work-item-priority-badge";
import { WorkItemStateBadge } from "@/components/work-items/work-item-state-badge";
import { WorkItemTagsReadonly } from "@/components/work-items/work-item-tags-readonly";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import { cn } from "@/lib/utils";

export type SprintGoalWorkItemCellProps = {
  workItem: AdoWorkItemOptionDto;
  muted?: boolean;
};

function SprintGoalWorkItemAssignee({ assignedTo }: { assignedTo?: string }) {
  if (assignedTo?.trim()) {
    return <WorkItemAssigneeTag name={assignedTo} />;
  }

  return (
    <span className="text-muted-foreground inline-flex shrink-0 items-center gap-1 text-xs whitespace-nowrap">
      <UserRound className="size-3 shrink-0" aria-hidden />
      <span>Sin asignar</span>
    </span>
  );
}

export function SprintGoalWorkItemCell({ workItem, muted = false }: SprintGoalWorkItemCellProps) {
  const hasPriority = workItem.priority !== undefined && Number.isFinite(workItem.priority);
  const hasEffort = workItem.effort !== undefined && Number.isFinite(workItem.effort);

  return (
    <div className={cn("flex min-w-80 flex-col gap-1.5", muted && "opacity-60")}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <WorkItemId id={workItem.id} className="shrink-0" />
        {workItem.state ? (
          <WorkItemStateBadge state={workItem.state} className="shrink-0" />
        ) : (
          <span className="text-muted-foreground shrink-0 text-xs whitespace-nowrap">Sin estado</span>
        )}
        <SprintGoalWorkItemAssignee assignedTo={workItem.assignedTo} />
        {hasPriority ? (
          <WorkItemPriorityBadge priority={workItem.priority!} className="shrink-0" />
        ) : (
          <span className="text-muted-foreground shrink-0 text-xs whitespace-nowrap">Sin prioridad</span>
        )}
        {hasEffort ? (
          <WorkItemEffortBadge effort={workItem.effort!} className="shrink-0" />
        ) : (
          <span className="text-muted-foreground shrink-0 text-xs whitespace-nowrap tabular-nums">
            Sin SP
          </span>
        )}
      </div>

      <p className="text-sm font-medium whitespace-nowrap" title={workItem.title}>
        {workItem.title}
      </p>

      <WorkItemTagsReadonly tags={workItem.tags} />
    </div>
  );
}
