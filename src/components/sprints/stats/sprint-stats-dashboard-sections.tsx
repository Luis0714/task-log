"use client";

import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintDeliverySection } from "@/components/dashboard/sections/sprint-delivery-section";
import { SprintWorkflowSection } from "@/components/dashboard/sections/sprint-workflow-section";
import { SprintBugQualitySection } from "@/components/sprints/stats/sprint-bug-quality-section";
import { SprintGoalProgressSection } from "@/components/sprints/stats/sprint-goal-progress-section";
import { SprintGoalRiskList } from "@/components/sprints/stats/sprint-goal-risk-list";
import { SPRINT_STATS_GOAL_ONLY_DEFAULT } from "@/lib/sprints/filter-sprint-stats-scope";
import type { SprintTimesShareScope } from "@/lib/sprints/sprint-times-share-scope";
import { normalizeSprintStatsScreenData } from "@/lib/sprints/normalize-sprint-stats";
import type { SprintStatsScreenData } from "@/lib/sprints/sprint-stats-types";

export type SprintStatsDashboardSectionsProps = {
  stats: SprintStatsScreenData;
  project: string | null;
  goalDescription?: string;
  goalOnly?: boolean;
  timesShareScope?: SprintTimesShareScope;
};

function deliveryDescription(goalOnly: boolean): string {
  return goalOnly
    ? "Historias y bugs vinculados a las historias del objetivo."
    : "Historias y bugs del equipo en este sprint.";
}

function workflowDescription(goalOnly: boolean): string {
  return goalOnly
    ? "Estados de las historias incluidas en el objetivo."
    : "Distribución de historias por estado de backlog.";
}

export function SprintStatsDashboardSections({
  stats,
  project,
  goalDescription,
  goalOnly = SPRINT_STATS_GOAL_ONLY_DEFAULT,
  timesShareScope: _timesShareScope,
  loading = false,
}: SprintStatsDashboardSectionsProps & { loading?: boolean }) {
  const showGoalSections = false;
  const normalizedStats = normalizeSprintStatsScreenData(stats);
  if (!normalizedStats) return null;

  return (
    <div className="flex flex-col gap-6">
     {showGoalSections && <>
      <DashboardSection title="Entrega del sprint" description={deliveryDescription(goalOnly)}>
        <SprintDeliverySection metrics={normalizedStats.delivery} />
      </DashboardSection>

      <DashboardSection title="Trabajo por estado" description={workflowDescription(goalOnly)}>
        <SprintWorkflowSection metrics={normalizedStats.workflow} />
      </DashboardSection>

      <SprintGoalRiskList items={normalizedStats.goal.objectiveItems} />

      <SprintGoalProgressSection goal={normalizedStats.goal} description={goalDescription} />
      <SprintBugQualitySection bugs={normalizedStats.bugs} project={project} loading={loading} />
      </>
      }
    </div>
  );
}
