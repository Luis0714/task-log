"use client";

import { CopilotErrorAlert } from "@/components/copilot/copilot-error-alert";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintStatsDashboardSections } from "@/components/sprints/stats/sprint-stats-dashboard-sections";
import { SprintStatsDashboardSkeleton } from "@/components/sprints/stats/sprint-stats-dashboard-skeleton";
import { SprintStatsScopeToggle } from "@/components/sprints/stats/sprint-stats-scope-toggle";
import type { SprintStatsScreenData } from "@/lib/sprints/sprint-stats-types";
import type { SprintTimesShareScope } from "@/lib/sprints/sprint-times-share-scope";
import { SPRINT_STATS_GOAL_ONLY_DEFAULT } from "@/lib/sprints/filter-sprint-stats-scope";

export type SprintStatsDashboardViewProps = {
  stats: SprintStatsScreenData | null;
  project: string | null;
  loading?: boolean;
  error?: string | null;
  isPastSprint?: boolean;
  goalOnly?: boolean;
  onGoalOnlyChange?: (value: boolean) => void;
  timesShareScope?: SprintTimesShareScope;
};

export function SprintStatsDashboardView({
  stats,
  project,
  loading = false,
  error = null,
  isPastSprint = false,
  goalOnly = SPRINT_STATS_GOAL_ONLY_DEFAULT,
  onGoalOnlyChange,
  timesShareScope,
}: SprintStatsDashboardViewProps) {
  if (error) {
    return <CopilotErrorAlert message={error} />;
  }

  if (loading) {
    return (
      <SprintStatsDashboardSkeleton showScopeToggle={Boolean(onGoalOnlyChange)} />
    );
  }

  if (!stats) {
    return (
      <DashboardSection
        title="Estadísticas del sprint"
        description={
          isPastSprint
            ? "Finaliza el sprint para guardar métricas históricas fiables."
            : "Métricas de entrega, calidad y cumplimiento del objetivo."
        }
      >
        <p className="text-muted-foreground text-sm">
          {isPastSprint
            ? "Este sprint aún no tiene retrospectiva guardada. Usa «Finalizar sprint» para congelar el resultado del cierre."
            : "No hay datos disponibles para este sprint."}
        </p>
      </DashboardSection>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {onGoalOnlyChange ? (
        <SprintStatsScopeToggle goalOnly={goalOnly} onGoalOnlyChange={onGoalOnlyChange} />
      ) : null}

      <SprintStatsDashboardSections
        stats={stats}
        project={project}
        goalOnly={goalOnly}
        timesShareScope={timesShareScope}
      />
    </div>
  );
}
