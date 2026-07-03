"use client";

import { SprintTimesShareDialog } from "@/components/sprints/stats/sprint-times-share-dialog";
import { useSprintTimesShare } from "@/hooks/sprints/use-sprint-times-share";
import type { SprintTimesMetrics } from "@/lib/sprints/sprint-stats-types";
import type { SprintTimesShareQuery } from "@/services/sprints/sprint-times-share.service";

export type SprintTimesShareActionsProps = Omit<
  SprintTimesShareQuery,
  "variant" | "times"
> & {
  times: SprintTimesMetrics;
  canShare: boolean;
};

export function SprintTimesShareActions({
  canShare,
  times,
  ...query
}: SprintTimesShareActionsProps) {
  const share = useSprintTimesShare({
    ...query,
    times,
    canShare,
  });

  return <SprintTimesShareDialog canShare={canShare} share={share} />;
}
