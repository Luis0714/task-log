"use client";

import { useMemo, useState, type ReactNode } from "react";

import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { AssigneeVisibilityCombobox } from "@/components/sprints/stats/assignee-visibility-combobox";
import { SPRINT_TIMES_TEAM_TOTAL_LABEL } from "@/components/sprints/stats/sprint-times-columns";
import { SprintTimesLegend } from "@/components/sprints/stats/sprint-times-hours-cell";
import { SprintTimesShareActions } from "@/components/sprints/stats/sprint-times-share-actions";
import { SprintTimesTable } from "@/components/sprints/stats/sprint-times-table";
import { SprintTimesWeekSelect } from "@/components/sprints/stats/sprint-times-week-select";
import { Skeleton } from "@/components/ui/skeleton";
import { totalHoursBreakdown } from "@/lib/hours/hours-breakdown";
import { computeCompliance } from "@/lib/reports/hours/compliance";
import {
  filterSprintTimesByWeek,
  parseSprintTimesWeekSelection,
  SPRINT_TIMES_WEEK_ALL,
} from "@/lib/sprints/filter-sprint-times-by-week";
import {
  buildSprintTimesShareWeekVariant,
  type SprintTimesShareVariant,
} from "@/lib/sprints/sprint-times-share-variant";
import { canShareSprintTimes } from "@/lib/sprints/sprint-times-share-eligibility";
import type { SprintTimesShareScope } from "@/lib/sprints/sprint-times-share-scope";
import type {
  SprintTimesMetrics,
  SprintTimesPersonRow,
} from "@/lib/sprints/sprint-stats-types";
import {
  sumSprintBreakdowns,
  sumWeekBreakdowns,
} from "@/lib/sprints/sum-hours-breakdowns";
import { useAssigneeVisibilityStore } from "@/store/assignee-visibility-store";

export type SprintTimesSectionProps = {
  times: SprintTimesMetrics;
  description?: string;
  loading?: boolean;
  className?: string;
  shareScope?: SprintTimesShareScope;
  extraAction?: ReactNode;
  allAssignees?: readonly string[];
};

const TIMES_SKELETON_ROWS = Array.from(
  { length: 8 },
  (_, index) => `times-skeleton-row-${index}`,
);

function TimesTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      {TIMES_SKELETON_ROWS.map((rowKey) => (
        <div
          key={rowKey}
          className="border-border/60 grid gap-3 border-b px-3 py-3 last:border-b-0 md:grid-cols-4"
        >
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

function buildTeamTotalRow(times: SprintTimesMetrics): SprintTimesPersonRow {
  const weeks = times.weeks.map((_, index) => sumWeekBreakdowns(times.rows, index));
  const sprint = sumSprintBreakdowns(times.rows);
  const expectedHours = times.rows.reduce((acc, row) => acc + row.expectedHours, 0);
  const { pct, level } = computeCompliance(totalHoursBreakdown(sprint), expectedHours);

  return {
    assignee: SPRINT_TIMES_TEAM_TOTAL_LABEL,
    weeks,
    sprint,
    expectedHours,
    expectedHoursByWeek: [],
    compliancePct: pct,
    semaforo: level,
  };
}

export function SprintTimesSection({
  times,
  description = "Horas registradas por persona, desglosadas por semana y tipo de trabajo.",
  loading = false,
  className,
  shareScope,
  extraAction,
  allAssignees,
}: Readonly<SprintTimesSectionProps>) {
  const [weekValue, setWeekValue] = useState<string>(SPRINT_TIMES_WEEK_ALL);

  const weekSelection = parseSprintTimesWeekSelection(weekValue, times.weeks.length);
  const visibleTimes = useMemo(
    () => filterSprintTimesByWeek(times, weekSelection),
    [times, weekSelection],
  );
  const shareVariant: SprintTimesShareVariant =
    weekSelection === SPRINT_TIMES_WEEK_ALL
      ? "full"
      : buildSprintTimesShareWeekVariant(weekSelection + 1);
  const totalRow = useMemo(() => buildTeamTotalRow(visibleTimes), [visibleTimes]);

  const hasRows = times.rows.length > 0;
  const hasWeeks = times.weeks.length > 0;

  const hiddenAssignees = useAssigneeVisibilityStore((s) => s.hidden);
  const toggleAssignee = useAssigneeVisibilityStore((s) => s.toggle);
  const showAssigneeFilter = allAssignees !== undefined;
  const hasActions =
    hasWeeks || showAssigneeFilter || Boolean(extraAction) || Boolean(shareScope);

  let content: ReactNode;
  if (loading) {
    content = <TimesTableSkeleton />;
  } else if (!hasWeeks) {
    content = (
      <p className="text-muted-foreground text-sm">
        No hay fechas de sprint configuradas para calcular semanas laborables.
      </p>
    );
  } else if (!hasRows) {
    content = (
      <p className="text-muted-foreground text-sm">
        Sin horas registradas en el alcance seleccionado.
      </p>
    );
  } else {
    content = <SprintTimesTable times={visibleTimes} totalRow={totalRow} />;
  }

  return (
    <DashboardSection
      title="Tiempos del sprint"
      description={description}
      className={className}
      action={
        hasActions ? (
        <div className="flex flex-wrap items-center gap-2">
          {hasWeeks ? (
            <SprintTimesWeekSelect
              weeks={times.weeks}
              value={weekValue}
              onValueChange={setWeekValue}
              disabled={loading || !hasRows}
            />
          ) : null}
          {showAssigneeFilter ? (
            <AssigneeVisibilityCombobox
              assignees={allAssignees!}
              hiddenAssignees={hiddenAssignees}
              onToggle={toggleAssignee}
              disabled={!allAssignees?.length}
            />
          ) : null}
          {extraAction}
          {shareScope ? (
            <SprintTimesShareActions
              {...shareScope}
              times={times}
              canShare={canShareSprintTimes(times)}
              initialVariant={shareVariant}
            />
          ) : null}
        </div>
        ) : null
      }
    >
      <div className="flex flex-col gap-3">
        <SprintTimesLegend />
        {content}
      </div>
    </DashboardSection>
  );
}
