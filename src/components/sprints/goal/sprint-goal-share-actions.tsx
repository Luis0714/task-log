"use client";

import { SprintGoalShareDialog } from "@/components/sprints/goal/sprint-goal-share-dialog";
import { useSprintGoalShare } from "@/hooks/sprints/use-sprint-goal-share";
import type { SprintGoalShareQuery } from "@/services/sprints/sprint-goal-share.service";

export type SprintGoalShareActionsProps = SprintGoalShareQuery & {
  canShare: boolean;
};

export function SprintGoalShareActions({
  canShare,
  ...query
}: SprintGoalShareActionsProps) {
  const share = useSprintGoalShare({ ...query, canShare });

  return <SprintGoalShareDialog canShare={canShare} share={share} />;
}
