import { Clock, Hourglass, Timer } from "lucide-react";

import { MetricProgressCard } from "@/components/dashboard/metrics/metric-progress-card";
import { MetricStatCard } from "@/components/dashboard/metrics/metric-stat-card";
import { PbiStatusBreakdown } from "@/components/dashboard/metrics/pbi-status-breakdown";
import { formatHours } from "@/lib/dashboard/format-hours";
import type { DashboardMetrics } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

export type SprintOverviewGridProps = {
  metrics: DashboardMetrics;
  loading?: boolean;
  className?: string;
};

export function SprintOverviewGrid({ metrics, loading = false, className }: SprintOverviewGridProps) {
  return (
    <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>
      <MetricStatCard
        label="Horas hoy"
        value={formatHours(metrics.hoursToday)}
        icon={Clock}
        loading={loading}
      />
      <MetricProgressCard
        label="Horas sprint"
        current={metrics.hoursSprintCurrent}
        target={metrics.hoursSprintTarget}
        icon={Timer}
        loading={loading}
      />
      <MetricStatCard
        label="Horas pendientes"
        value={formatHours(metrics.hoursRemaining)}
        icon={Hourglass}
        hint="Restantes del sprint"
        loading={loading}
      />
      <PbiStatusBreakdown groups={metrics.pbiStateGroups} loading={loading} />
    </div>
  );
}
