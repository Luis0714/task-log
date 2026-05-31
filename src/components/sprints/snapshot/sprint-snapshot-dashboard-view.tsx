"use client";

import { DashboardKpi } from "@/components/dashboard/charts/dashboard-kpi";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import {
  computeSnapshotGoalAchievementPercent,
  computeSnapshotStoryPointsPercent,
} from "@/lib/sprints/sprint-snapshot-display";
import type { SprintSnapshotData } from "@/lib/sprints/sprint-snapshot-types";
import { formatStoryPoints } from "@/lib/dashboard/work-item-selectors";

export type SprintSnapshotDashboardViewProps = {
  snapshot: SprintSnapshotData;
};

export function SprintSnapshotDashboardView({ snapshot }: SprintSnapshotDashboardViewProps) {
  const { summary } = snapshot;
  const goalPercent = computeSnapshotGoalAchievementPercent(summary);
  const storyPointsPercent = computeSnapshotStoryPointsPercent(summary);

  return (
    <div className="flex flex-col gap-6">
      <DashboardSection
        title="Cumplimiento del objetivo"
        description="Resultado congelado al cierre del sprint."
      >
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-12">
          <DashboardKpi
            size="compact"
            layout="stack"
            label="Objetivos cumplidos"
            value={`${summary.goalsAchievedCount} / ${summary.goalsTotalCount}`}
            progress={goalPercent}
            variant={goalPercent >= 75 ? "success" : goalPercent >= 40 ? "warning" : "destructive"}
            highlight
            className="min-w-0 lg:col-span-3"
          />
          <DashboardKpi
            size="compact"
            layout="stack"
            label="Parciales"
            value={String(summary.goalsPartialCount)}
            className="min-w-0 lg:col-span-3"
          />
          <DashboardKpi
            size="compact"
            layout="stack"
            label="No cumplidas"
            value={String(summary.goalsMissedCount)}
            variant={summary.goalsMissedCount > 0 ? "destructive" : "default"}
            className="min-w-0 lg:col-span-3"
          />
          <DashboardKpi
            size="compact"
            layout="stack"
            label="Story points en objetivo"
            value={`${formatStoryPoints(summary.storyPointsAchieved)} / ${formatStoryPoints(summary.storyPointsInGoal)} SP`}
            progress={storyPointsPercent}
            variant={
              storyPointsPercent >= 75
                ? "success"
                : storyPointsPercent >= 40
                  ? "warning"
                  : "default"
            }
            className="min-w-0 lg:col-span-3"
          />
        </div>
      </DashboardSection>

      <DashboardSection
        title="Detalle por estado"
        description="Distribución de historias según su resultado al cierre."
      >
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
          <DashboardKpi
            size="compact"
            layout="inline"
            label="Cumplidas"
            value={String(summary.goalsAchievedCount)}
            variant="success"
          />
          <DashboardKpi
            size="compact"
            layout="inline"
            label="Parciales"
            value={String(summary.goalsPartialCount)}
            variant="warning"
          />
          <DashboardKpi
            size="compact"
            layout="inline"
            label="Fallidas"
            value={String(summary.goalsMissedCount)}
            variant="destructive"
          />
          <DashboardKpi
            size="compact"
            layout="inline"
            label="Excluidas"
            value={String(summary.goalsExcludedCount)}
          />
          <DashboardKpi
            size="compact"
            layout="inline"
            label="Sin meta"
            value={String(summary.goalsNoTargetCount)}
          />
        </div>
      </DashboardSection>
    </div>
  );
}
