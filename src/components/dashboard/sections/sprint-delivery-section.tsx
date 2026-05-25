"use client";

import { ChartPanel } from "@/components/dashboard/charts/chart-panel";
import { DashboardKpi } from "@/components/dashboard/charts/dashboard-kpi";
import { GroupedBarChart } from "@/components/dashboard/charts/grouped-bar-chart";
import {
  buildDeliveryChartRows,
  completionPercent,
} from "@/lib/dashboard/delivery-chart-data";
import type { DashboardMetrics } from "@/lib/dashboard/types";
import { formatStoryPoints } from "@/lib/dashboard/work-item-selectors";
import { cn } from "@/lib/utils";

export type SprintDeliverySectionProps = {
  metrics: DashboardMetrics;
  loading?: boolean;
  className?: string;
};

export function SprintDeliverySection({
  metrics,
  loading = false,
  className,
}: SprintDeliverySectionProps) {
  const rows = buildDeliveryChartRows(metrics.sprintStatusOverview);
  const hasData = rows.some(
    (row) => row.pending > 0 || row.inProgress > 0 || row.completed > 0,
  );
  const { userStories, bugs } = metrics.sprintStatusOverview;
  const huPercent = completionPercent(userStories);
  const bugPercent = completionPercent(bugs);

  return (
    <div className={cn("grid gap-3 lg:grid-cols-12", className)}>
      <ChartPanel
        title="Estado de entrega"
        loading={loading}
        isEmpty={!hasData}
        emptyMessage="Sin historias ni bugs asignados en este sprint."
        highlight={huPercent >= 75 || bugPercent >= 75}
        className="lg:col-span-8"
      >
        <GroupedBarChart rows={rows} />
      </ChartPanel>

      <div className="flex flex-col gap-2 lg:col-span-4">
        <DashboardKpi
          label="HU desarrolladas"
          value={`${huPercent}%`}
          progress={huPercent}
          variant={huPercent >= 50 ? "success" : userStories.pending > 0 ? "warning" : "default"}
          highlight={huPercent >= 75}
          hint={
            userStories.assigned > 0
              ? `${userStories.completed} de ${userStories.assigned}`
              : "Sin historias"
          }
          loading={loading}
        />
        <DashboardKpi
          label="Bugs atendidos"
          value={`${bugPercent}%`}
          progress={bugPercent}
          variant={bugs.pending > 0 && bugPercent < 50 ? "warning" : bugPercent >= 50 ? "success" : "default"}
          highlight={bugs.assigned > 0 && bugs.pending === 0}
          hint={
            bugs.assigned > 0 ? `${bugs.completed} de ${bugs.assigned}` : "Sin bugs"
          }
          loading={loading}
        />
        <DashboardKpi
          label="Story points"
          value={formatStoryPoints(metrics.storyPointsAssigned)}
          variant="accent"
          hint={
            metrics.pbiProgress.totalCount > 0
              ? `${metrics.pbiProgress.totalCount} historias`
              : undefined
          }
          loading={loading}
        />
      </div>
    </div>
  );
}
