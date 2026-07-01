"use client";

import { Bug } from "lucide-react";

import { ChartPanel } from "@/components/dashboard/charts/chart-panel";
import { HorizontalBarChart } from "@/components/dashboard/charts/horizontal-bar-chart";
import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { ProgressRingKpi } from "@/components/dashboard/metrics/progress-ring/progress-ring-kpi";
import {
  PROGRESS_RING_PAIR_CELL_CLASS,
  ProgressRingPairGrid,
} from "@/components/dashboard/metrics/progress-ring/progress-ring-pair-grid";
import { SprintBugProgressCard } from "@/components/dashboard/metrics/sprint-bug-progress-card";
import { Badge } from "@/components/ui/badge";
import { SprintBugDetailList } from "@/components/sprints/stats/sprint-bug-detail-list";
import { WorkItemAssigneeLabel } from "@/components/work-items/work-item-assignee-tag";
import { useSprintBugDetailFilter } from "@/hooks/sprints/use-sprint-bug-detail-filter";
import { useCurrentProject } from "@/hooks/use-current-project";
import { useBugStates } from "@/hooks/use-bug-states";
import { buildGoalBugsKpiViewModel } from "@/lib/dashboard/progress-ring/build-view-models";
import { SPRINT_BUG_UNASSIGNED_LABEL } from "@/lib/sprints/filter-sprint-bug-detail-items";
import { getStateChartColor } from "@/lib/work-items/pbi-state-colors";
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
  const goalBugsKpi = buildGoalBugsKpiViewModel(bugs);

  // Los estados del chart son de BUGS (no de PBI): usamos el catálogo de Bug
  // del proyecto activo para que el color de cada barra venga directo de Azure.
  const currentProject = useCurrentProject();
  const { states: bugStates } = useBugStates(currentProject);
  const bugStateColorLookup = (state: string) => getStateChartColor(bugStates, state);

  const {
    detailFilter,
    filteredItems,
    selectedStateKeys,
    toggleStateFilter,
    toggleAssigneeFilter,
    clearFilter,
    isAssigneeSelected,
    filterDescription,
  } = useSprintBugDetailFilter(bugItems);

  return (
    <DashboardSection
      title="Calidad — Bugs del sprint"
      description="Estado de bugs del equipo y su relación con historias del objetivo."
      className={className}
    >
      <div className="flex flex-col gap-3">
        <ProgressRingPairGrid>
          <SprintBugProgressCard
            bugs={bugs}
            loading={loading}
            className={PROGRESS_RING_PAIR_CELL_CLASS}
          />

          <ProgressRingKpi model={goalBugsKpi} loading={loading} />
        </ProgressRingPairGrid>

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
              onBarClick={(bar) => toggleStateFilter(bar.state)}
              tooltipValueLabel="bugs"
              stateColorLookup={bugStateColorLookup}
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
              {assigneeRows.map((row) => (
                <li key={row.assignee}>
                  <button
                    type="button"
                    aria-pressed={isAssigneeSelected(row.assignee)}
                    onClick={() => toggleAssigneeFilter(row.assignee)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
                      "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      isAssigneeSelected(row.assignee) &&
                        "bg-primary/8 ring-1 ring-inset ring-primary/25",
                    )}
                  >
                    <span className="min-w-0">
                      <WorkItemAssigneeLabel
                        assignee={
                          row.assignee === SPRINT_BUG_UNASSIGNED_LABEL ? null : row.assignee
                        }
                        imageUrl={row.imageUrl}
                      />
                    </span>
                    <span className="text-muted-foreground shrink-0 tabular-nums">
                      {row.open} abiertos · {row.total} total
                    </span>
                  </button>
                </li>
              ))}
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
                  {filterDescription} · {filteredItems.length}
                </Badge>
                <button
                  type="button"
                  onClick={clearFilter}
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
          ) : filteredItems.length === 0 && detailFilter ? (
            <p className="text-muted-foreground text-sm">
              No hay bugs que coincidan con {filterDescription?.toLowerCase()}.
            </p>
          ) : (
            <SprintBugDetailList items={filteredItems} project={project} />
          )}
        </div>
      </div>
    </DashboardSection>
  );
}
