import { WorkItemAssigneeTag } from "@/components/work-items/work-item-assignee-tag";
import { WorkItemId } from "@/components/work-items/work-item-id";
import { WorkItemStateBadge } from "@/components/work-items/work-item-state-badge";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

export type WorkItemOptionHeaderProps = {
  item: Pick<AdoWorkItemOptionDto, "id" | "state" | "assignedTo">;
};

export function WorkItemOptionHeader({ item }: WorkItemOptionHeaderProps) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-2">
      <WorkItemId id={item.id} />
      <div className="flex min-w-0 shrink items-center justify-end gap-1.5">
        {item.assignedTo ? <WorkItemAssigneeTag name={item.assignedTo} /> : null}
        {item.state ? (
          <WorkItemStateBadge state={item.state} className="max-w-26" />
        ) : null}
      </div>
    </div>
  );
}
