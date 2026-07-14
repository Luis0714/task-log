"use client";

import { useMemo, type ReactNode } from "react";

import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import { AssigneeVisibilityCombobox } from "@/components/sprints/stats/assignee-visibility-combobox";
import {
  SprintTimesBugHoursValue,
  SprintTimesBugSubColumnHeader,
  SprintTimesDevHoursValue,
  SprintTimesDevSubColumnHeader,
  SprintTimesLegend,
  SprintTimesTotalCell,
  SprintTimesTotalSubColumnHeader,
  SprintTimesWeekTotalValue,
} from "@/components/sprints/stats/sprint-times-hours-cell";
import { Skeleton } from "@/components/ui/skeleton";
import { TeamMemberAvatar } from "@/components/team-members/team-member-avatar";
import { EMPTY_HOURS_BREAKDOWN, totalHoursBreakdown } from "@/lib/hours/hours-breakdown";
import type { HoursBreakdown } from "@/lib/hours/hours-breakdown";
import type {
  SprintTimesMetrics,
  SprintTimesPersonRow,
  SprintTimesWeekColumn,
} from "@/lib/sprints/sprint-stats-types";
import { SprintTimesShareActions } from "@/components/sprints/stats/sprint-times-share-actions";
import type { SprintTimesShareScope } from "@/lib/sprints/sprint-times-share-scope";
import { canShareSprintTimes } from "@/lib/sprints/sprint-times-share-eligibility";
import { cn } from "@/lib/utils";
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

const WEEK_ODD_CLASS = "bg-primary/[0.07]";
const WEEK_EVEN_CLASS = "bg-muted/50";
const WEEK_ODD_EMPHASIZED = "bg-primary/[0.1]";
const WEEK_EVEN_EMPHASIZED = "bg-muted/65";

function weekGroupClass(weekIndex: number, emphasized = false): string {
  const isOdd = weekIndex % 2 === 0;
  if (emphasized) return isOdd ? WEEK_ODD_EMPHASIZED : WEEK_EVEN_EMPHASIZED;
  return isOdd ? WEEK_ODD_CLASS : WEEK_EVEN_CLASS;
}

function buildTableGridStyle(weekCount: number): React.CSSProperties {
  return {
    display: "grid",
    gridTemplateColumns: `minmax(8rem, 1.1fr) repeat(${weekCount}, minmax(14rem, 1.3fr)) minmax(7rem, 0.95fr)`,
    gap: "0 0.75rem",
  };
}

function WeekGroupBlock({
  weekIndex,
  emphasized = false,
  className,
  children,
}: {
  weekIndex: number;
  emphasized?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-3 rounded-md",
        weekGroupClass(weekIndex, emphasized),
        className,
      )}
    >
      {children}
    </div>
  );
}

function WeekGroupCell({
  children,
  withDivider = false,
  className,
}: {
  children: ReactNode;
  withDivider?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center px-3 py-2",
        withDivider && "border-border/20 border-l",
        className,
      )}
    >
      {children}
    </div>
  );
}

function sumWeekBreakdowns(
  rows: readonly SprintTimesPersonRow[],
  weekIndex: number,
): HoursBreakdown {
  return rows.reduce(
    (acc, row) => {
      const w = row.weeks[weekIndex] ?? EMPTY_HOURS_BREAKDOWN;
      return { taskHours: acc.taskHours + w.taskHours, bugHours: acc.bugHours + w.bugHours };
    },
    { ...EMPTY_HOURS_BREAKDOWN },
  );
}

function sumSprintBreakdowns(rows: readonly SprintTimesPersonRow[]): HoursBreakdown {
  return rows.reduce(
    (acc, row) => ({
      taskHours: acc.taskHours + row.sprint.taskHours,
      bugHours: acc.bugHours + row.sprint.bugHours,
    }),
    { ...EMPTY_HOURS_BREAKDOWN },
  );
}

function WeekGroupHeader({ week }: { week: SprintTimesWeekColumn }) {
  return (
    <div className="min-w-0 text-center">
      <p className="text-xs font-medium">{week.label}</p>
      {week.dateRangeLabel ? (
        <p className="text-muted-foreground truncate text-[10px]">{week.dateRangeLabel}</p>
      ) : null}
    </div>
  );
}

function TimesTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
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

function TimesRow({
  assignee,
  weeks,
  sprint,
  emphasized = false,
  weekCount,
}: {
  assignee: string;
  weeks: HoursBreakdown[];
  sprint: HoursBreakdown;
  emphasized?: boolean;
  weekCount: number;
}) {
  return (
    <li
      style={buildTableGridStyle(weekCount)}
      className={cn("items-center px-3 py-1", emphasized && "bg-muted/15")}
    >
      <div className="flex min-w-0 items-center gap-2 py-1.5">
        <TeamMemberAvatar name={assignee} size="sm" />
        <p className="truncate text-sm font-medium" title={assignee}>
          {assignee}
        </p>
      </div>

      {Array.from({ length: weekCount }, (_, index) => {
        const breakdown = weeks[index] ?? EMPTY_HOURS_BREAKDOWN;
        return (
          <WeekGroupBlock key={index} weekIndex={index} emphasized={emphasized}>
            <WeekGroupCell>
              <SprintTimesDevHoursValue value={breakdown.taskHours} className="w-full" />
            </WeekGroupCell>
            <WeekGroupCell withDivider>
              <SprintTimesWeekTotalValue value={totalHoursBreakdown(breakdown)} />
            </WeekGroupCell>
            <WeekGroupCell withDivider>
              <SprintTimesBugHoursValue value={breakdown.bugHours} className="w-full" />
            </WeekGroupCell>
          </WeekGroupBlock>
        );
      })}

      <div className="flex items-center justify-center py-2">
        <SprintTimesTotalCell breakdown={sprint} />
      </div>
    </li>
  );
}

export function SprintTimesSection({
  times,
  description = "Horas registradas por persona, desglosadas por semana y tipo de trabajo.",
  loading = false,
  className,
  shareScope,
  extraAction,
  allAssignees,
}: SprintTimesSectionProps) {
  const weekCount = times.weeks.length;

  const weekTotals = useMemo(
    () => Array.from({ length: weekCount }, (_, i) => sumWeekBreakdowns(times.rows, i)),
    [times.rows, weekCount],
  );

  const sprintTotal = useMemo(() => sumSprintBreakdowns(times.rows), [times.rows]);

  const hasRows = times.rows.length > 0;
  const hasWeeks = weekCount > 0;
  const tableGridStyle = buildTableGridStyle(weekCount);

  const hiddenAssignees = useAssigneeVisibilityStore((s) => s.hidden);
  const toggleAssignee = useAssigneeVisibilityStore((s) => s.toggle);
  const showAssigneeFilter = allAssignees !== undefined;

  return (
    <DashboardSection
      title="Tiempos del sprint"
      description={description}
      className={className}
      action={
        showAssigneeFilter || shareScope || extraAction ? (
          <div className="flex flex-wrap items-center gap-2">
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
              />
            ) : null}
          </div>
        ) : null
      }
    >
      <div className="flex flex-col gap-3">
        <SprintTimesLegend />

        {loading ? (
          <TimesTableSkeleton />
        ) : !hasWeeks ? (
          <p className="text-muted-foreground text-sm">
            No hay fechas de sprint configuradas para calcular semanas laborables.
          </p>
        ) : !hasRows ? (
          <p className="text-muted-foreground text-sm">
            Sin horas registradas en el alcance seleccionado.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60">
            <div className="min-w-3xl">
              <div
                style={tableGridStyle}
                className="border-border/60 bg-muted/20 items-center px-3 py-2"
              >
                <span className="text-muted-foreground text-xs font-medium">Persona</span>
                {times.weeks.map((week, index) => (
                  <div
                    key={index}
                    className={cn("rounded-md px-2 py-1.5 text-center", weekGroupClass(index))}
                  >
                    <WeekGroupHeader week={week} />
                  </div>
                ))}
                <div className="min-w-0 text-center">
                  <p className="text-xs font-medium">Tiempo sprint</p>
                </div>
              </div>

              <div
                style={tableGridStyle}
                className="border-border/60 border-b px-3 pb-1"
              >
                <span />
                {times.weeks.map((_, index) => (
                  <WeekGroupBlock key={index} weekIndex={index}>
                    <WeekGroupCell className="py-1.5">
                      <SprintTimesDevSubColumnHeader />
                    </WeekGroupCell>
                    <WeekGroupCell withDivider className="py-1.5">
                      <SprintTimesTotalSubColumnHeader />
                    </WeekGroupCell>
                    <WeekGroupCell withDivider className="py-1.5">
                      <SprintTimesBugSubColumnHeader />
                    </WeekGroupCell>
                  </WeekGroupBlock>
                ))}
                <span className="text-muted-foreground flex items-center justify-center py-1.5 text-center text-[10px] font-medium uppercase tracking-wide">
                  Total
                </span>
              </div>

              <ul className="divide-border/60 divide-y">
                {times.rows.map((row) => (
                  <TimesRow
                    key={row.assignee}
                    assignee={row.assignee}
                    weeks={row.weeks}
                    sprint={row.sprint}
                    weekCount={weekCount}
                  />
                ))}

                <TimesRow
                  assignee="Total equipo"
                  weeks={weekTotals}
                  sprint={sprintTotal}
                  weekCount={weekCount}
                  emphasized
                />
              </ul>
            </div>
          </div>
        )}
      </div>
    </DashboardSection>
  );
}
