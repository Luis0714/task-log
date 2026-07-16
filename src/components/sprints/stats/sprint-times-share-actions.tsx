"use client";

import { SprintTimesShareDialog } from "@/components/sprints/stats/sprint-times-share-dialog";
import { useSprintTimesShare } from "@/hooks/sprints/use-sprint-times-share";
import type { SprintTimesMetrics } from "@/lib/sprints/sprint-stats-types";
import type { SprintTimesShareVariant } from "@/lib/sprints/sprint-times-share-variant";
import type { SprintTimesShareQuery } from "@/services/sprints/sprint-times-share.service";

export type SprintTimesShareActionsProps = Omit<
  SprintTimesShareQuery,
  "variant" | "times"
> & {
  times: SprintTimesMetrics;
  canShare: boolean;
  initialVariant?: SprintTimesShareVariant;
};

export function SprintTimesShareActions({
  canShare,
  times,
  initialVariant,
  ...query
}: SprintTimesShareActionsProps) {
  const share = useSprintTimesShare({
    ...query,
    times,
    canShare,
    initialVariant,
  });

  return <SprintTimesShareDialog canShare={canShare} share={share} />;
}
