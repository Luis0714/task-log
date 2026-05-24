import { getWorkItemStatePresentation } from "@/lib/time-log/work-item-presentation";
import { cn } from "@/lib/utils";

export type WorkItemStateBadgeProps = {
  state: string;
  className?: string;
};

export function WorkItemStateBadge({ state, className }: WorkItemStateBadgeProps) {
  const presentation = getWorkItemStatePresentation(state);

  return (
    <span
      className={cn(
        "inline-flex min-w-0 max-w-[58%] shrink items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        presentation.className,
        className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", presentation.dotClassName)} aria-hidden />
      <span className="truncate">{state}</span>
    </span>
  );
}
