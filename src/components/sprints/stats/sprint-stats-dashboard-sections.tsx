"use client";

import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { SprintDeliverySection } from "@/components/dashboard/sections/sprint-delivery-section";
import { SprintWorkflowSection } from "@/components/dashboard/sections/sprint-workflow-section";
import { SprintBugQualitySection } from "@/components/sprints/stats/sprint-bug-quality-section";
import { SprintGoalProgressSection } from "@/components/sprints/stats/sprint-goal-progress-section";
import { SprintGoalRiskList } from "@/components/sprints/stats/sprint-goal-risk-list";
import { SprintTimesSection } from "@/components/sprints/stats/sprint-times-section";
import type { SprintStatsScreenData } from "@/lib/sprints/sprint-stats-types";
import { normalizeSprintStatsScreenData } from "@/lib/sprints/normalize-sprint-stats";

export type SprintStatsDashboardSectionsProps = {
  stats: SprintStatsScreenData;
  project: string | null;
  goalDescription?: string;
  goalOnly?: boolean;
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

function timesDescription(goalOnly: boolean): string {
  return goalOnly
    ? "Horas en tareas y bugs vinculados a las historias del objetivo."
    : "Horas del equipo en desarrollo y corrección de bugs.";
}

export function SprintStatsDashboardSections({
  stats,
  project,
  goalDescription,
  goalOnly = false,
  loading = false,
}: SprintStatsDashboardSectionsProps & { loading?: boolean }) {
  const normalizedStats = normalizeSprintStatsScreenData(stats);
  if (!normalizedStats) return null;

  return (
    <div className="flex flex-col gap-6">
      <SprintGoalProgressSection goal={normalizedStats.goal} description={goalDescription} />
      <SprintGoalRiskList items={normalizedStats.goal.riskItems} />
      <SprintBugQualitySection bugs={normalizedStats.bugs} project={project} loading={loading} />

      <SprintTimesSection
        times={normalizedStats.times}
        description={timesDescription(goalOnly)}
        loading={loading}
      />

      <DashboardSection title="Entrega del sprint" description={deliveryDescription(goalOnly)}>
        <SprintDeliverySection metrics={normalizedStats.delivery} />
      </DashboardSection>

      <DashboardSection title="Trabajo por estado" description={workflowDescription(goalOnly)}>
        <SprintWorkflowSection metrics={normalizedStats.workflow} />
      </DashboardSection>
    </div>
  );
}
