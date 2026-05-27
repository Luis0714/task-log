import { WorkItemId } from "@/components/work-items/work-item-id";
import { WorkItemStateBadge } from "@/components/work-items/work-item-state-badge";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

export type WorkItemOptionHeaderProps = {
  item: Pick<AdoWorkItemOptionDto, "id" | "state">;
};

export function WorkItemOptionHeader({ item }: WorkItemOptionHeaderProps) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-2">
      <WorkItemId id={item.id} />
      {item.state ? <WorkItemStateBadge state={item.state} /> : null}
    </div>
  );
}
