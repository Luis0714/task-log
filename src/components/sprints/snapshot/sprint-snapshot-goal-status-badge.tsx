import { SprintGoalStatusBadge } from "@/components/sprints/goal/sprint-goal-status-badge";
import type { SprintStoryGoalStatus } from "@/lib/sprints/sprint-snapshot-types";

export type SprintSnapshotGoalStatusBadgeProps = {
  status: SprintStoryGoalStatus;
  className?: string;
};

export function SprintSnapshotGoalStatusBadge({
  status,
  className,
}: SprintSnapshotGoalStatusBadgeProps) {
  return <SprintGoalStatusBadge status={status} className={className} />;
}
