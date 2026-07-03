import { Badge } from "@/components/ui/badge";
import { getSprintStoryGoalStatusLabel } from "@/lib/sprints/sprint-snapshot-display";
import type { SprintStoryGoalStatus } from "@/lib/sprints/sprint-snapshot-types";
import { cn } from "@/lib/utils";

const STATUS_CLASS: Record<SprintStoryGoalStatus, string> = {
  achieved:
    "border-emerald-500/45 bg-emerald-500/10 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  partial:
    "border-amber-500/45 bg-amber-500/10 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
  missed: "border-destructive/45 bg-destructive/10 text-destructive",
  excluded: "border-border/60 bg-muted/40 text-muted-foreground",
  no_target: "border-border/60 bg-muted/30 text-muted-foreground",
};

export type SprintGoalStatusBadgeProps = {
  status: SprintStoryGoalStatus;
  className?: string;
};

export function SprintGoalStatusBadge({ status, className }: SprintGoalStatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn("shrink-0", STATUS_CLASS[status], className)}>
      {getSprintStoryGoalStatusLabel(status)}
    </Badge>
  );
}
