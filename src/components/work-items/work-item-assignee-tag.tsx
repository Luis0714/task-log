import { UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

export type WorkItemAssigneeTagProps = {
  name: string;
  className?: string;
};

export function WorkItemAssigneeTag({ name, className }: WorkItemAssigneeTagProps) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 max-w-30 shrink items-center gap-1 rounded-full border border-primary/35",
        "bg-primary/12 px-2 py-0.5 text-[10px] font-medium text-primary",
        "dark:bg-primary/18 dark:text-primary",
        className,
      )}
      title={name}
    >
      <UserRound className="size-3 shrink-0" aria-hidden />
      <span className="truncate">{name}</span>
    </span>
  );
}
