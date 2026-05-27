"use client";



import { Bug, Gauge, ListChecks } from "lucide-react";



import { ChartPanel } from "@/components/dashboard/charts/chart-panel";

import { GroupedBarChart } from "@/components/dashboard/charts/grouped-bar-chart";

import { DeliveryMetricCard } from "@/components/dashboard/metrics/delivery-metric-card";

import {

  buildDeliveryChartRows,

  completionPercent,

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

  const storyPoints = metrics.storyPointsAssigned;



  const huVariant = resolveUserStoriesMetricVariant(userStories, huPercent);

  const bugsVariant = resolveBugsMetricVariant(bugs, bugPercent);

  const storyPointsVariant = resolveStoryPointsMetricVariant(storyPoints);



  return (

    <div className={cn("grid gap-3 lg:grid-cols-12", className)}>

      <div className="grid min-w-0 grid-cols-3 gap-2 lg:col-span-4 lg:grid-cols-1 lg:gap-2">

        <DeliveryMetricCard

          title="HU desarrolladas"

          icon={ListChecks}

          value={huVariant === "empty" ? "—" : `${huPercent}%`}

          progress={

            userStories.assigned > 0

              ? kpiProgressPercent(userStories.completed, userStories.assigned)

              : undefined

          }

          variant={huVariant}

          highlight={huVariant === "success" || huVariant === "primary"}

          hint={

            userStories.assigned > 0

              ? `${userStories.completed} de ${userStories.assigned}`

              : "Sin historias asignadas"

          }

          loading={loading}

        />

        <DeliveryMetricCard
          title="Bugs atendidos"
          icon={Bug}
          iconClassName={
            bugsVariant === "success"
              ? BUG_ICON_ATTENDED_CLASS
              : bugsVariant === "bugOpen" || bugsVariant === "default"
                ? BUG_ICON_OPEN_CLASS
                : undefined
          }
          value={bugs.assigned === 0 ? "0 Bugs" : `${bugPercent}%`}
          progress={
            bugs.assigned > 0
              ? kpiProgressPercent(bugs.completed, bugs.assigned)
              : undefined
          }
          variant={bugsVariant}
          highlight={bugsVariant === "success" || bugsVariant === "bugOpen"}
          hint={
            bugs.assigned > 0
              ? `${bugs.completed}/${bugs.assigned}`
              : "Sin Bugs en el sprint"
          }
          loading={loading}
        />

        <DeliveryMetricCard

          title="Puntos de historia"

          icon={Gauge}

          value={storyPointsVariant === "empty" ? "—" : formatStoryPoints(storyPoints)}

          variant={storyPointsVariant}

          highlight={storyPointsVariant === "accent"}

          hint={

            storyPointsVariant === "empty"

              ? "Sin puntos asignados"

              : metrics.pbiProgress.totalCount > 0

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

        emptyMessage="Sin historias ni Bugs asignados en este sprint."

        highlight={huPercent >= 75 || bugPercent >= 75}

        className="min-w-0 lg:col-span-8"

      >

        <GroupedBarChart rows={rows} className="h-[140px] sm:h-[150px]" />

      </ChartPanel>

    </div>

  );

}


