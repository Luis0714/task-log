"use client";

import { ChartPanel } from "@/components/dashboard/charts/chart-panel";
import { DashboardKpi } from "@/components/dashboard/charts/dashboard-kpi";
import { GroupedBarChart } from "@/components/dashboard/charts/grouped-bar-chart";
import {
  buildDeliveryChartRows,
  completionPercent,
} from "@/lib/dashboard/delivery-chart-data";
import type { DashboardDeliveryMetrics } from "@/lib/dashboard/types";
import { kpiProgressPercent, kpiVariantFromProgress } from "@/lib/dashboard/kpi-variant";
import { formatStoryPoints } from "@/lib/dashboard/work-item-selectors";
import { cn } from "@/lib/utils";

export type SprintDeliverySectionProps = {
  metrics: DashboardDeliveryMetrics;
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
      <div className="grid grid-cols-3 gap-2 sm:max-w-md lg:col-span-4 lg:max-w-none lg:grid-cols-1 lg:gap-1.5">
        <DashboardKpi
          size="compact"
          layout="inline"
          label="HU desarrolladas"
          value={`${huPercent}%`}
          progress={
            userStories.assigned > 0
              ? kpiProgressPercent(userStories.completed, userStories.assigned)
              : undefined
          }
          variant={
            userStories.assigned > 0
              ? kpiVariantFromProgress(userStories.completed, userStories.assigned, {
                  lowProgress: userStories.pending > 0 && huPercent < 50,
                })
              : "default"
          }
          highlight={huPercent >= 75}
          hint={
            userStories.assigned > 0
              ? `${userStories.completed} de ${userStories.assigned}`
              : "Sin historias"
          }
          loading={loading}
        />
        <DashboardKpi
          size="compact"
          layout="inline"
          label="Bugs atendidos"
          value={`${bugPercent}%`}
          progress={
            bugs.assigned > 0 ? kpiProgressPercent(bugs.completed, bugs.assigned) : undefined
          }
          variant={
            bugs.assigned > 0
              ? kpiVariantFromProgress(bugs.completed, bugs.assigned, {
                  lowProgress: bugs.pending > 0 && bugPercent < 50,
                })
              : "default"
          }
          highlight={bugs.assigned > 0 && bugs.pending === 0}
          hint={bugs.assigned > 0 ? `${bugs.completed} de ${bugs.assigned}` : "Sin bugs"}
          loading={loading}
        />
        <DashboardKpi
          size="compact"
          layout="inline"
          label="Story points"
          value={formatStoryPoints(metrics.storyPointsAssigned)}
          variant="accent"
          highlight={metrics.storyPointsAssigned > 0}
          hint={
            metrics.pbiProgress.totalCount > 0
              ? `${metrics.pbiProgress.totalCount} historias`
              : undefined
          }
          loading={loading}
        />
      </div>

      <ChartPanel
        title="Estado de entrega"
        size="compact"
        loading={loading}
        isEmpty={!hasData}
        emptyMessage="Sin historias ni bugs asignados en este sprint."
        highlight={huPercent >= 75 || bugPercent >= 75}
        className="min-w-0 lg:col-span-8"
      >
        <GroupedBarChart rows={rows} className="h-[140px] sm:h-[150px]" />
      </ChartPanel>
    </div>
  );
}
