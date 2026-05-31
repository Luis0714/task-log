import { Badge } from "@/components/ui/badge";
import { getSprintStoryGoalStatusLabel } from "@/lib/sprints/sprint-snapshot-display";
import type { SprintStoryGoalStatus } from "@/lib/sprints/sprint-snapshot-types";
import { cn } from "@/lib/utils";

const STATUS_VARIANT: Record<
  SprintStoryGoalStatus,
  "default" | "secondary" | "destructive" | "outline" | "ghost"
> = {
  achieved: "default",
  partial: "secondary",
  missed: "destructive",
  excluded: "outline",
  no_target: "ghost",
};

export type SprintSnapshotGoalStatusBadgeProps = {
  status: SprintStoryGoalStatus;
  className?: string;
};

export function SprintSnapshotGoalStatusBadge({
  status,
  className,
}: SprintSnapshotGoalStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status]} className={cn("shrink-0", className)}>
      {getSprintStoryGoalStatusLabel(status)}
    </Badge>
  );
}
