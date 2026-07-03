import { CheckCircle2, CircleDashed, ListChecks } from "lucide-react";

import { ProgressRingCard } from "@/components/dashboard/metrics/progress-ring/progress-ring-card";
import { buildPbiProgressRingViewModel } from "@/lib/dashboard/progress-ring/build-view-models";
import type { SprintPbiProgress } from "@/lib/dashboard/types";

const PBI_BREAKDOWN_ICONS = {
  completed: CheckCircle2,
  pending: CircleDashed,
  inProgress: ListChecks,
} as const;

export type SprintPbiProgressCardProps = {
  progress: SprintPbiProgress;
  loading?: boolean;
  highlight?: boolean;
  className?: string;
};

export function SprintPbiProgressCard({
  progress,
  loading = false,
  highlight,
  className,
}: SprintPbiProgressCardProps) {
  const model = buildPbiProgressRingViewModel(progress);

  return (
    <ProgressRingCard
      model={model}
      iconsByItemId={PBI_BREAKDOWN_ICONS}
      loading={loading}
      highlight={highlight}
      className={className}
    />
  );
}
