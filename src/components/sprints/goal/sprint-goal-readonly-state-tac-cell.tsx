import { Badge } from "@/components/ui/badge";
import { WorkItemStateBadge } from "@/components/work-items/work-item-state-badge";
import { cn } from "@/lib/utils";

const TAC_CLASS =
  "border-border/60 bg-muted/30 text-muted-foreground text-xs font-normal";

type SprintGoalReadonlyStateTacCellProps = {
  stateName: string | null;
  tacTagName: string | null;
  className?: string;
};

export function SprintGoalReadonlyStateTacCell({
  stateName,
  tacTagName,
  className,
}: SprintGoalReadonlyStateTacCellProps) {
  const state = stateName?.trim() ?? "";
  const tac = tacTagName?.trim() ?? "";

  if (!state && !tac) {
    return (
      <div className={cn("flex w-full justify-center", className)}>
        <span className="text-muted-foreground text-sm">—</span>
      </div>
    );
  }

  return (
    <div className={cn("flex w-full flex-col items-center gap-1.5", className)}>
      {state ? (
        <WorkItemStateBadge state={state} className="w-fit max-w-full" />
      ) : null}
      {tac ? (
        <Badge variant="outline" className={TAC_CLASS}>
          {tac}
        </Badge>
      ) : null}
    </div>
  );
}
