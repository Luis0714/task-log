"use client";

import { SprintPbiProgressCard } from "@/components/dashboard/metrics/sprint-pbi-progress-card";
import type { SprintWorkflowSectionMetrics } from "@/lib/sprints/sprint-stats-types";
import { cn } from "@/lib/utils";

export type SprintWorkflowSectionProps = {
  metrics: SprintWorkflowSectionMetrics;
  loading?: boolean;
  className?: string;
};

export function SprintWorkflowSection({
  metrics,
  loading = false,
  className,
}: SprintWorkflowSectionProps) {
  const pbiDone = metrics.pbiProgress.percent >= 75;

  return (
    <div className={cn(className)}>
      <SprintPbiProgressCard
        progress={metrics.pbiProgress}
        loading={loading}
        highlight={pbiDone}
      />
    </div>
  );
}
