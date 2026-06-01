import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";

import { ProgressRingCard } from "@/components/dashboard/metrics/progress-ring/progress-ring-card";
import { buildGoalProgressRingViewModel } from "@/lib/dashboard/progress-ring/build-view-models";
import type { SprintGoalMetrics } from "@/lib/sprints/sprint-stats-types";

const GOAL_BREAKDOWN_ICONS = {
  achieved: CheckCircle2,
  partial: CircleDashed,
  missed: XCircle,
} as const;

export type SprintGoalProgressCardProps = {
  goal: SprintGoalMetrics;
  loading?: boolean;
  className?: string;
};

export function SprintGoalProgressCard({
  goal,
  loading = false,
  className,
}: SprintGoalProgressCardProps) {
  const model = buildGoalProgressRingViewModel(goal);

  return (
    <ProgressRingCard
      model={model}
      iconsByItemId={GOAL_BREAKDOWN_ICONS}
      loading={loading}
      className={className}
    />
  );
}
