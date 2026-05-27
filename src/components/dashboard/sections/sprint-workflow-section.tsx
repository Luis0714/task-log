"use client";

import { ChartPanel } from "@/components/dashboard/charts/chart-panel";
import { HorizontalBarChart } from "@/components/dashboard/charts/horizontal-bar-chart";
import { SprintPbiProgressCard } from "@/components/dashboard/metrics/sprint-pbi-progress-card";
import { buildPbiStateBars } from "@/lib/dashboard/pbi-state-chart-data";
import type { DashboardWorkflowMetrics } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

export type SprintWorkflowSectionProps = {
  metrics: DashboardWorkflowMetrics;
  loading?: boolean;
  className?: string;
};

export function SprintWorkflowSection({
  metrics,
  loading = false,
  className,
}: SprintWorkflowSectionProps) {
  const stateBars = buildPbiStateBars(metrics.pbiStateGroups);
  const pbiDone = metrics.pbiProgress.percent >= 75;

  return (
    <div className={cn("grid gap-3 lg:grid-cols-12", className)}>
      <SprintPbiProgressCard
        progress={metrics.pbiProgress}
        loading={loading}
        highlight={pbiDone}
        className="lg:col-span-4"
      />

      <ChartPanel
        title="Historias de usuario por estado"
        size="compact"
        loading={loading}
        isEmpty={stateBars.length === 0}
        emptyMessage="Sin estados de backlog disponibles."
        highlight={stateBars.length > 0}
        className="lg:col-span-8"
      >
        <HorizontalBarChart bars={stateBars} />
      </ChartPanel>
    </div>
  );
}
