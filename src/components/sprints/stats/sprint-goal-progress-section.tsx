"use client";

import { DashboardKpi } from "@/components/dashboard/charts/dashboard-kpi";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { formatStoryPoints } from "@/lib/dashboard/work-item-selectors";
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
  const { summary } = goal;

  return (
    <DashboardSection title="Cumplimiento del objetivo" description={description}>
      {goal.generalObjective ? (
        <p className="text-muted-foreground mb-1 text-sm text-pretty">{goal.generalObjective}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-12">
        <DashboardKpi
          size="compact"
          layout="stack"
          label="Objetivos cumplidos"
          value={`${summary.goalsAchievedCount} / ${summary.goalsTotalCount}`}
          progress={goal.achievementPercent}
          variant={
            goal.achievementPercent >= 75
              ? "success"
              : goal.achievementPercent >= 40
                ? "warning"
                : "destructive"
          }
          highlight
          loading={loading}
          className="min-w-0 lg:col-span-3"
        />
        <DashboardKpi
          size="compact"
          layout="stack"
          label="Parciales"
          value={String(summary.goalsPartialCount)}
          loading={loading}
          className="min-w-0 lg:col-span-3"
        />
        <DashboardKpi
          size="compact"
          layout="stack"
          label="No cumplidas"
          value={String(summary.goalsMissedCount)}
          variant={summary.goalsMissedCount > 0 ? "destructive" : "default"}
          loading={loading}
          className="min-w-0 lg:col-span-3"
        />
        <DashboardKpi
          size="compact"
          layout="stack"
          label="Story points en objetivo"
          value={`${formatStoryPoints(summary.storyPointsAchieved)} / ${formatStoryPoints(summary.storyPointsInGoal)} SP`}
          progress={goal.storyPointsPercent}
          variant={
            goal.storyPointsPercent >= 75
              ? "success"
              : goal.storyPointsPercent >= 40
                ? "warning"
                : "default"
          }
          loading={loading}
          className="min-w-0 lg:col-span-3"
        />
      </div>
    </DashboardSection>
  );
}
