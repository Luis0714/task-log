import { PbiStateDot } from "@/components/work-items/pbi-state-dot";
import { WorkItemId } from "@/components/work-items/work-item-id";
import { WorkItemKindIcon } from "@/components/work-items/work-item-kind-icon";
import type { LinkableWorkItemDto } from "@/lib/work-items/linkable-work-item";
import { cn } from "@/lib/utils";

export type LinkableWorkItemRowProps = {
  item: LinkableWorkItemDto;
  className?: string;
};

export function LinkableWorkItemRow({ item, className }: LinkableWorkItemRowProps) {
  return (
    <span className={cn("flex min-w-0 flex-1 items-center gap-2 overflow-hidden", className)}>
      <WorkItemKindIcon kind={item.kind} />
      <WorkItemId id={item.id} size="xs" />
      <span className="min-w-0 flex-1 truncate" title={item.title}>
        {item.title}
      </span>
      {item.state ? (
        <span title={item.state} className="shrink-0">
          <PbiStateDot state={item.state} className="size-1.5" />
        </span>
      ) : null}
    </span>
  );
}
