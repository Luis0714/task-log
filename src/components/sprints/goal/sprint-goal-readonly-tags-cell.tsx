import { WorkItemTagsReadonly } from "@/components/work-items/work-item-tags-readonly";
import { cn } from "@/lib/utils";

type SprintGoalReadonlyTagsCellProps = {
  tagNames: readonly string[];
  className?: string;
};

export function SprintGoalReadonlyTagsCell({
  tagNames,
  className,
}: SprintGoalReadonlyTagsCellProps) {
  return (
    <WorkItemTagsReadonly
      tags={tagNames}
      emptyLabel="Sin tags"
      className={cn(className)}
    />
  );
}
