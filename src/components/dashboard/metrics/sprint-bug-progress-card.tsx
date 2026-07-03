import { CheckCircle2, CircleDashed, UserRound } from "lucide-react";

import { ProgressRingCard } from "@/components/dashboard/metrics/progress-ring/progress-ring-card";
import { buildBugProgressRingViewModel } from "@/lib/dashboard/progress-ring/build-view-models";
import type { SprintBugQualityMetrics } from "@/lib/sprints/sprint-stats-types";

const BUG_BREAKDOWN_ICONS = {
  attended: CheckCircle2,
  open: CircleDashed,
  unassigned: UserRound,
} as const;

export type SprintBugProgressCardProps = {
  bugs: SprintBugQualityMetrics;
  loading?: boolean;
  className?: string;
};

export function SprintBugProgressCard({
  bugs,
  loading = false,
  className,
}: SprintBugProgressCardProps) {
  const model = buildBugProgressRingViewModel(bugs);

  return (
    <ProgressRingCard
      model={model}
      iconsByItemId={BUG_BREAKDOWN_ICONS}
      loading={loading}
      className={className}
    />
  );
}
