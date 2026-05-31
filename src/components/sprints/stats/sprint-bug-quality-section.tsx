"use client";

import { useEffect, useMemo, useState } from "react";

import { Bug } from "lucide-react";

import { ChartPanel } from "@/components/dashboard/charts/chart-panel";
import { DashboardKpi } from "@/components/dashboard/charts/dashboard-kpi";
import { HorizontalBarChart } from "@/components/dashboard/charts/horizontal-bar-chart";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { Badge } from "@/components/ui/badge";
import { SprintBugDetailList } from "@/components/sprints/stats/sprint-bug-detail-list";
import { WorkItemAssigneeLabel } from "@/components/work-items/work-item-assignee-tag";
import {
  describeSprintBugDetailFilter,
  filterSprintBugDetailItems,
  isSprintBugDetailFilterValueSelected,
  SPRINT_BUG_UNASSIGNED_LABEL,
  toggleSprintBugDetailFilterValue,
  type SprintBugDetailFilter,
} from "@/lib/sprints/filter-sprint-bug-detail-items";
import type { SprintBugQualityMetrics } from "@/lib/sprints/sprint-stats-types";
import { cn } from "@/lib/utils";

export type SprintBugQualitySectionProps = {
  bugs: SprintBugQualityMetrics;
  project: string | null;
  loading?: boolean;
  className?: string;
};

export function SprintBugQualitySection({
  bugs,
  project,
  loading = false,
  className,
}: SprintBugQualitySectionProps) {
  const bugItems = bugs.items ?? [];
  const stateBars = bugs.stateBars ?? [];
  const assigneeRows = bugs.assigneeRows ?? [];
  const [detailFilter, setDetailFilter] = useState<SprintBugDetailFilter | null>(null);

  const bugItemsKey = useMemo(
    () => bugItems.map((item) => item.workItemId).join(","),
    [bugItems],
  );

  useEffect(() => {
    setDetailFilter(null);
  }, [bugItemsKey]);

  const filteredBugItems = useMemo(
    () => filterSprintBugDetailItems(bugItems, detailFilter),
    [bugItems, detailFilter],
  );

  const selectedStateKeys = detailFilter?.kind === "state" ? detailFilter.values : [];

  const attendedVariant =
    bugs.attendedPercent >= 75 ? "success" : bugs.attendedPercent >= 40 ? "warning" : "destructive";

  function handleStateBarClick(state: string) {
    setDetailFilter((current) => toggleSprintBugDetailFilterValue(current, "state", state));
  }

  function handleAssigneeClick(assignee: string) {
    setDetailFilter((current) => toggleSprintBugDetailFilterValue(current, "assignee", assignee));
  }

  return (
    <DashboardSection
      title="Calidad — Bugs del sprint"
      description="Estado de bugs del equipo y su relación con historias del objetivo."
      className={className}
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-12">
          <DashboardKpi
            size="compact"
            layout="stack"
            label="Bugs totales"
            value={String(bugs.total)}
            loading={loading}
            className="min-w-0 lg:col-span-2"
          />
          <DashboardKpi
            size="compact"
            layout="stack"
            label="Abiertos"
            value={String(bugs.open)}
            variant={bugs.open > 0 ? "destructive" : "default"}
            loading={loading}
            className="min-w-0 lg:col-span-2"
          />
          <DashboardKpi
            size="compact"
            layout="stack"
            label="Atendidos"
            value={`${bugs.attendedPercent}%`}
            progress={bugs.attendedPercent}
            variant={attendedVariant}
            highlight
            loading={loading}
            className="min-w-0 lg:col-span-2"
          />
          <DashboardKpi
            size="compact"
            layout="stack"
            label="Sin asignar"
            value={String(bugs.unassigned)}
            variant={bugs.unassigned > 0 ? "warning" : "default"}
            loading={loading}
            className="min-w-0 lg:col-span-2"
          />
          <DashboardKpi
            size="compact"
            layout="stack"
            label="Bugs en HUs del objetivo"
            value={`${bugs.goalBugsOpen} / ${bugs.goalBugsTotal}`}
            variant={bugs.goalBugsOpen > 0 ? "warning" : "success"}
            loading={loading}
            className="min-w-0 lg:col-span-4"
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-12">
          <ChartPanel
            title="Bugs por estado"
            size="compact"
            loading={loading}
            isEmpty={stateBars.length === 0}
            emptyMessage="Sin bugs en este sprint."
            highlight={bugs.total > 0}
            className="min-w-0 lg:col-span-7"
          >
            <HorizontalBarChart
              bars={stateBars}
              selectedBarKeys={selectedStateKeys}
              onBarClick={(bar) => handleStateBarClick(bar.state)}
              tooltipValueLabel="bugs"
            />
          </ChartPanel>

          <div
            className={cn(
              "min-w-0 rounded-lg border border-border/60 lg:col-span-5",
              assigneeRows.length === 0 && "hidden",
            )}
          >
            <div className="border-border/60 flex items-center gap-2 border-b px-3 py-2">
              <Bug className="text-muted-foreground size-4" aria-hidden />
              <h3 className="text-sm font-medium">Por persona asignada</h3>
            </div>
            <ul className="divide-border/60 max-h-56 divide-y overflow-y-auto">
              {assigneeRows.map((row) => {
                const isSelected = isSprintBugDetailFilterValueSelected(
                  detailFilter,
                  "assignee",
                  row.assignee,
                );

                return (
                  <li key={row.assignee}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleAssigneeClick(row.assignee)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
                        "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                        isSelected && "bg-primary/8 ring-1 ring-inset ring-primary/25",
                      )}
                    >
                      <span className="min-w-0">
                        <WorkItemAssigneeLabel
                          assignee={
                            row.assignee === SPRINT_BUG_UNASSIGNED_LABEL ? null : row.assignee
                          }
                        />
                      </span>
                      <span className="text-muted-foreground shrink-0 tabular-nums">
                        {row.open} abiertos · {row.total} total
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {bugs.goalStoriesWithOpenBugs > 0 ? (
          <p className="text-muted-foreground text-sm">
            {bugs.goalStoriesWithOpenBugs}{" "}
            {bugs.goalStoriesWithOpenBugs === 1
              ? "historia del objetivo tiene"
              : "historias del objetivo tienen"}{" "}
            bugs abiertos.
          </p>
        ) : null}

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium">Detalle por bug</h3>
            {detailFilter ? (
              <>
                <Badge variant="secondary" className="font-normal">
                  {describeSprintBugDetailFilter(detailFilter)} · {filteredBugItems.length}
                </Badge>
                <button
                  type="button"
                  onClick={() => setDetailFilter(null)}
                  className="text-muted-foreground hover:text-foreground text-xs underline-offset-4 hover:underline"
                >
                  Ver todos
                </button>
              </>
            ) : null}
          </div>

          {bugs.total > 0 && bugItems.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Esta retrospectiva no incluye el listado detallado. Vuelve a finalizar el sprint para
              capturarlo.
            </p>
          ) : filteredBugItems.length === 0 && detailFilter ? (
            <p className="text-muted-foreground text-sm">
              No hay bugs que coincidan con {describeSprintBugDetailFilter(detailFilter).toLowerCase()}.
            </p>
          ) : (
            <SprintBugDetailList items={filteredBugItems} project={project} />
          )}
        </div>
      </div>
    </DashboardSection>
  );
}
