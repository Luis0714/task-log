"use client";

import { useMemo, useState } from "react";

import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintStatsDashboardSections } from "@/components/sprints/stats/sprint-stats-dashboard-sections";
import { SprintGoalProgressSection } from "@/components/sprints/stats/sprint-goal-progress-section";
import { SprintGoalRiskList } from "@/components/sprints/stats/sprint-goal-risk-list";
import { SprintStatsScopeToggle } from "@/components/sprints/stats/sprint-stats-scope-toggle";
import { buildSprintGoalMetricsFromStories } from "@/lib/sprints/build-sprint-goal-metrics-from-stories";
import { resolveSprintStatsScope } from "@/lib/sprints/filter-sprint-stats-scope";
import { resolveSnapshotOperationalMetrics } from "@/lib/sprints/parse-sprint-snapshot-stats-payload";
import type { SprintSnapshotData } from "@/lib/sprints/sprint-snapshot-types";
import { normalizeSprintStatsScreenData } from "@/lib/sprints/normalize-sprint-stats";
import type { SprintStatsScreenData } from "@/lib/sprints/sprint-stats-types";

export type SprintSnapshotDashboardViewProps = {
  snapshot: SprintSnapshotData;
  project: string | null;
};

export function SprintSnapshotDashboardView({
  snapshot,
  project,
}: SprintSnapshotDashboardViewProps) {
  const [goalOnly, setGoalOnly] = useState(false);

  const goal = useMemo(
    () =>
      buildSprintGoalMetricsFromStories(
        snapshot.stories,
        snapshot.summary,
        snapshot.generalObjective,
      ),
    [snapshot],
  );

  const stats = useMemo((): SprintStatsScreenData | null => {
    if (!snapshot.statsPayload) return null;

    const operational = resolveSnapshotOperationalMetrics(
      snapshot.statsPayload,
      resolveSprintStatsScope(goalOnly),
    );

    return normalizeSprintStatsScreenData({ goal, ...operational });
  }, [goal, goalOnly, snapshot.statsPayload]);

  if (!stats) {
    return (
      <div className="flex flex-col gap-6">
        <SprintGoalProgressSection
          goal={goal}
          description="Resultado congelado al cierre del sprint."
        />
        <SprintGoalRiskList items={goal.riskItems} />

        <DashboardSection
          title="Entrega y calidad"
          description="Esta retrospectiva se guardó antes de congelar métricas operativas."
        >
          <p className="text-muted-foreground text-sm">
            Los sprints finalizados a partir de ahora incluyen entrega, bugs y flujo congelados.
          </p>
        </DashboardSection>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SprintStatsScopeToggle goalOnly={goalOnly} onGoalOnlyChange={setGoalOnly} />

      <SprintStatsDashboardSections
        stats={stats}
        project={project}
        goalOnly={goalOnly}
        goalDescription="Resultado congelado al cierre del sprint."
      />
    </div>
  );
}
