"use client";

import { Bug, Gauge, ListChecks } from "lucide-react";

import { ChartPanel } from "@/components/dashboard/charts/chart-panel";

import { GroupedBarChart } from "@/components/dashboard/charts/grouped-bar-chart";

import { DeliveryMetricCard } from "@/components/dashboard/metrics/delivery-metric-card";

import {
  buildDeliveryChartRows,
  completionPercent,
  formatMetricRatio,
  storyPointsCompletionPercent,
} from "@/lib/dashboard/delivery-chart-data";

import {
  resolveBugsMetricVariant,
  resolveStoryPointsMetricVariant,
  resolveUserStoriesMetricVariant,
} from "@/lib/dashboard/delivery-metric-variant";

import { kpiProgressPercent } from "@/lib/dashboard/kpi-variant";

import type { DashboardDeliveryMetrics } from "@/lib/dashboard/types";

import { formatStoryPoints } from "@/lib/dashboard/work-item-selectors";

import {
  BUG_ICON_ATTENDED_CLASS,
  BUG_ICON_OPEN_CLASS,
} from "@/lib/brand/bug-colors";

import { cn } from "@/lib/utils";

export type SprintDeliverySectionProps = {
  metrics: DashboardDeliveryMetrics;

  loading?: boolean;

  className?: string;
};

type SprintDeliveryViewModel = {
  rows: ReturnType<typeof buildDeliveryChartRows>;
  hasData: boolean;
  huPercent: number;
  bugPercent: number;
  huVariant: ReturnType<typeof resolveUserStoriesMetricVariant>;
  storyPointsVariant: ReturnType<typeof resolveStoryPointsMetricVariant>;
  storyPointsAssigned: number;
  storyPointsDeveloped: number;
  spPercent: number;
  bugsCardVariant: ReturnType<typeof resolveBugsMetricVariant> | "success";
  isBugsEmptySprint: boolean;
  bugsIconClassName?: string;
};

function buildSprintDeliveryViewModel(metrics: DashboardDeliveryMetrics): SprintDeliveryViewModel {
  const { userStories, bugs } = metrics.sprintStatusOverview;
  const rows = buildDeliveryChartRows(metrics.sprintStatusOverview);
  const hasData = rows.some(
    (row) => row.pending > 0 || row.inProgress > 0 || row.completed > 0,
  );

  const huPercent = completionPercent(userStories);
  const bugPercent = completionPercent(bugs);
  const storyPointsAssigned = metrics.storyPointsAssigned;
  const storyPointsDeveloped = metrics.storyPointsDeveloped;
  const spPercent = storyPointsCompletionPercent(
    storyPointsDeveloped,
    storyPointsAssigned,
  );

  const huVariant = resolveUserStoriesMetricVariant(userStories, huPercent);
  const bugsVariant = resolveBugsMetricVariant(bugs, bugPercent);
  const isBugsEmptySprint = bugs.assigned <= 0;
  const bugsCardVariant = isBugsEmptySprint ? "success" : bugsVariant;
  const storyPointsVariant = resolveStoryPointsMetricVariant(
    storyPointsDeveloped,
    storyPointsAssigned,
    spPercent,
  );

  const bugsIconClassName =
    bugsCardVariant === "success"
      ? BUG_ICON_ATTENDED_CLASS
      : bugsCardVariant === "bugOpen" || bugsCardVariant === "default"
        ? BUG_ICON_OPEN_CLASS
        : undefined;

  return {
    rows,
    hasData,
    huPercent,
    bugPercent,
    huVariant,
    storyPointsVariant,
    storyPointsAssigned,
    storyPointsDeveloped,
    spPercent,
    bugsCardVariant,
    isBugsEmptySprint,
    bugsIconClassName,
  };
}

export function SprintDeliverySection({
  metrics,

  loading = false,

  className,
}: SprintDeliverySectionProps) {
  const viewModel = buildSprintDeliveryViewModel(metrics);
  const { userStories, bugs } = metrics.sprintStatusOverview;

  return (
    <div className={cn("grid gap-3 lg:grid-cols-12", className)}>
      <div className="grid min-w-0 grid-cols-3 gap-2 lg:col-span-4 lg:grid-cols-1 lg:gap-2">
        <DeliveryMetricCard
          title="Desarrolladas"
          icon={ListChecks}
          value={viewModel.huVariant === "empty" ? "—" : `${viewModel.huPercent}%`}
          progress={
            userStories.assigned > 0
              ? kpiProgressPercent(userStories.completed, userStories.assigned)
              : undefined
          }
          variant={viewModel.huVariant}
          highlight={viewModel.huVariant === "success" || viewModel.huVariant === "primary"}
          hint={
            userStories.assigned > 0
              ? formatMetricRatio(userStories.completed, userStories.assigned)
              : "Sin historias asignadas"
          }
          loading={loading}
        />

        <DeliveryMetricCard
          title="Bugs atendidos"
          icon={Bug}
          iconClassName={viewModel.bugsIconClassName}
          value={viewModel.isBugsEmptySprint ? "0 Bugs" : `${viewModel.bugPercent}%`}
          progress={
            !viewModel.isBugsEmptySprint
              ? kpiProgressPercent(bugs.completed, bugs.assigned)
              : undefined
          }
          variant={viewModel.bugsCardVariant}
          highlight={viewModel.isBugsEmptySprint || viewModel.bugsCardVariant === "bugOpen"}
          hint={
            !viewModel.isBugsEmptySprint
              ? formatMetricRatio(bugs.completed, bugs.assigned)
              : "Sin bugs en el sprint"
          }
          loading={loading}
        />

        <DeliveryMetricCard
          title="Puntos Historia"
          icon={Gauge}
          value={viewModel.storyPointsVariant === "empty" ? "—" : `${viewModel.spPercent}%`}
          progress={
            viewModel.storyPointsAssigned > 0
              ? kpiProgressPercent(viewModel.storyPointsDeveloped, viewModel.storyPointsAssigned)
              : undefined
          }
          variant={viewModel.storyPointsVariant}
          highlight={
            viewModel.storyPointsVariant === "success" ||
            viewModel.storyPointsVariant === "primary"
          }
          hint={
            viewModel.storyPointsAssigned > 0
              ? formatMetricRatio(
                  viewModel.storyPointsDeveloped,
                  viewModel.storyPointsAssigned,
                  formatStoryPoints,
                )
              : "Sin puntos asignados"
          }
          loading={loading}
        />
      </div>

      <ChartPanel
        title="Estado de entrega"
        size="compact"
        loading={loading}
        isEmpty={!viewModel.hasData}
        emptyMessage="Sin historias ni Bugs asignados en este sprint."
        highlight={viewModel.huPercent >= 75 || viewModel.bugPercent >= 75}
        className="min-w-0 lg:col-span-8"
      >
        <GroupedBarChart rows={viewModel.rows} className="h-[140px] sm:h-[150px]" />
      </ChartPanel>
    </div>
  );
}
