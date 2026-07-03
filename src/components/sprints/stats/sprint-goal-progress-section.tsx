"use client";

import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { ProgressRingKpi } from "@/components/dashboard/metrics/progress-ring/progress-ring-kpi";
import {
  PROGRESS_RING_PAIR_CELL_CLASS,
  ProgressRingPairGrid,
} from "@/components/dashboard/metrics/progress-ring/progress-ring-pair-grid";
import { SprintGoalProgressCard } from "@/components/dashboard/metrics/sprint-goal-progress-card";
import { buildGoalAchievementKpiViewModel } from "@/lib/dashboard/progress-ring/build-view-models";
import type { SprintGoalMetrics } from "@/lib/sprints/sprint-stats-types";

export type SprintGoalProgressSectionProps = {
  goal: SprintGoalMetrics;
  description?: string;
  loading?: boolean;
};

export function SprintGoalProgressSection({
  goal,
  description = "Avance del equipo respecto al objetivo definido para este sprint.",
  loading = false,
}: SprintGoalProgressSectionProps) {
  const achievementKpi = buildGoalAchievementKpiViewModel(goal);

  return (
    <DashboardSection
      title="Cumplimiento del objetivo"
      description={description}
      contentClassName="flex flex-col gap-3"
    >
      {goal.generalObjective ? (
        <p className="text-muted-foreground text-sm text-pretty">{goal.generalObjective}</p>
      ) : null}

      <ProgressRingPairGrid>
        <SprintGoalProgressCard
          goal={goal}
          loading={loading}
          className={PROGRESS_RING_PAIR_CELL_CLASS}
        />

        <ProgressRingKpi model={achievementKpi} loading={loading} />
      </ProgressRingPairGrid>
    </DashboardSection>
  );
}
