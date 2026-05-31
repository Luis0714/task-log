import { UserRound } from "lucide-react";

import { getAssigneeTagClasses } from "@/lib/work-items/assignee-tag-colors";
import { cn } from "@/lib/utils";

export type WorkItemAssigneeTagProps = {
  name: string;
  className?: string;
};

export function WorkItemAssigneeTag({ name, className }: WorkItemAssigneeTagProps) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 max-w-30 shrink items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        getAssigneeTagClasses(name),
        className,
      )}
      title={name}
    >
      <UserRound className="size-3 shrink-0" aria-hidden />
      <span className="truncate">{name}</span>
    </span>
  );
}

export type WorkItemAssigneeLabelProps = {
  assignee: string | null | undefined;
  className?: string;
};

export function WorkItemAssigneeLabel({ assignee, className }: WorkItemAssigneeLabelProps) {
  const name = assignee?.trim();
  if (name) {
    return <WorkItemAssigneeTag name={name} className={className} />;
  }

  return (
    <span
      className={cn(
        "text-muted-foreground inline-flex shrink-0 items-center gap-1 text-xs whitespace-nowrap",
        className,
      )}
    >
      <UserRound className="size-3 shrink-0" aria-hidden />
      <span>Sin asignar</span>
    </span>
  );
}
