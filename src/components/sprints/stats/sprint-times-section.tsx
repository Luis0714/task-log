"use client";

import { useMemo, type ReactNode } from "react";

import { DashboardSection } from "@/components/dashboard/layout/dashboard-section";
import {
  SprintTimesBugHoursValue,
  SprintTimesBugSubColumnHeader,
  SprintTimesDevHoursValue,
  SprintTimesDevSubColumnHeader,
  SprintTimesLegend,
  SprintTimesTotalCell,
} from "@/components/sprints/stats/sprint-times-hours-cell";
import { Skeleton } from "@/components/ui/skeleton";
import { EMPTY_HOURS_BREAKDOWN } from "@/lib/dashboard/hours-breakdown";
import type { HoursBreakdown } from "@/lib/dashboard/hours-breakdown";
import type {
  SprintTimesMetrics,
  SprintTimesPersonRow,
  SprintTimesWeekColumn,
} from "@/lib/sprints/sprint-stats-types";
import { SprintTimesShareActions } from "@/components/sprints/stats/sprint-times-share-actions";
import type { SprintTimesShareScope } from "@/lib/sprints/sprint-times-share-scope";
import { canShareSprintTimes } from "@/lib/sprints/sprint-times-share-eligibility";
import { cn } from "@/lib/utils";

export type SprintTimesSectionProps = {
  times: SprintTimesMetrics;
  description?: string;
  loading?: boolean;
  className?: string;
  shareScope?: SprintTimesShareScope;
};

const TABLE_GRID =
  "grid grid-cols-[minmax(8rem,1.1fr)_minmax(11rem,1.15fr)_minmax(11rem,1.15fr)_minmax(7rem,0.95fr)] gap-x-3";

const WEEK1_GROUP_CLASS = "bg-primary/[0.07]";
const WEEK2_GROUP_CLASS = "bg-muted/50";

function weekGroupClass(variant: "week1" | "week2", emphasized = false) {
  const base = variant === "week1" ? WEEK1_GROUP_CLASS : WEEK2_GROUP_CLASS;
  return emphasized
    ? cn(base, variant === "week1" ? "bg-primary/[0.1]" : "bg-muted/65")
    : base;
}

function WeekGroupBlock({
  variant,
  emphasized = false,
  className,
  children,
}: {
  variant: "week1" | "week2";
  emphasized?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 rounded-md",
        weekGroupClass(variant, emphasized),
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

function defaultWeekMeta(index: number): SprintTimesWeekColumn {
  return {
    label: index === 0 ? "Semana 1" : "Semana 2",
    dateRangeLabel: "",
    workingDaysCount: 0,
  };
}

function sumBreakdowns(
  rows: readonly SprintTimesPersonRow[],
  key: "week1" | "week2" | "sprint",
): HoursBreakdown {
  return rows.reduce(
    (acc, row) => ({
      taskHours: acc.taskHours + row[key].taskHours,
      bugHours: acc.bugHours + row[key].bugHours,
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
      {Array.from({ length: 4 }).map((_, index) => (
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
  week1,
  week2,
  sprint,
  emphasized = false,
}: {
  assignee: string;
  week1: HoursBreakdown;
  week2: HoursBreakdown;
  sprint: HoursBreakdown;
  emphasized?: boolean;
}) {
  return (
    <li className={cn(TABLE_GRID, "items-center px-3 py-1", emphasized && "bg-muted/15")}>
      <p className="truncate py-2 text-sm font-medium" title={assignee}>
        {assignee}
      </p>

      <WeekGroupBlock variant="week1" emphasized={emphasized}>
        <WeekGroupCell>
          <SprintTimesDevHoursValue value={week1.taskHours} className="w-full" />
        </WeekGroupCell>
        <WeekGroupCell withDivider>
          <SprintTimesBugHoursValue value={week1.bugHours} className="w-full" />
        </WeekGroupCell>
      </WeekGroupBlock>

      <WeekGroupBlock variant="week2" emphasized={emphasized}>
        <WeekGroupCell>
          <SprintTimesDevHoursValue value={week2.taskHours} className="w-full" />
        </WeekGroupCell>
        <WeekGroupCell withDivider>
          <SprintTimesBugHoursValue value={week2.bugHours} className="w-full" />
        </WeekGroupCell>
      </WeekGroupBlock>

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
}: SprintTimesSectionProps) {
  const week1 = times.weeks[0] ?? defaultWeekMeta(0);
  const week2 = times.weeks[1] ?? defaultWeekMeta(1);

  const totals = useMemo(
    () => ({
      week1: sumBreakdowns(times.rows, "week1"),
      week2: sumBreakdowns(times.rows, "week2"),
      sprint: sumBreakdowns(times.rows, "sprint"),
    }),
    [times.rows],
  );

  const hasRows = times.rows.length > 0;
  const hasWeeks = times.weeks.length > 0;

  return (
    <DashboardSection
      title="Tiempos del sprint"
      description={description}
      className={className}
      action={
        shareScope && !loading ? (
          <SprintTimesShareActions
            {...shareScope}
            times={times}
            canShare={canShareSprintTimes(times)}
          />
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
              <div className={cn(TABLE_GRID, "border-border/60 bg-muted/20 items-center px-3 py-2")}>
                <span className="text-muted-foreground text-xs font-medium">Persona</span>
                <div className={cn("rounded-md px-2 py-1.5 text-center", WEEK1_GROUP_CLASS)}>
                  <WeekGroupHeader week={week1} />
                </div>
                <div className={cn("rounded-md px-2 py-1.5 text-center", WEEK2_GROUP_CLASS)}>
                  <WeekGroupHeader week={week2} />
                </div>
                <div className="min-w-0 text-center">
                  <p className="text-xs font-medium">Tiempo sprint</p>
                </div>
              </div>

              <div className={cn(TABLE_GRID, "border-border/60 border-b px-3 pb-1")}>
                <span />
                <WeekGroupBlock variant="week1">
                  <WeekGroupCell className="py-1.5">
                    <SprintTimesDevSubColumnHeader />
                  </WeekGroupCell>
                  <WeekGroupCell withDivider className="py-1.5">
                    <SprintTimesBugSubColumnHeader />
                  </WeekGroupCell>
                </WeekGroupBlock>
                <WeekGroupBlock variant="week2">
                  <WeekGroupCell className="py-1.5">
                    <SprintTimesDevSubColumnHeader />
                  </WeekGroupCell>
                  <WeekGroupCell withDivider className="py-1.5">
                    <SprintTimesBugSubColumnHeader />
                  </WeekGroupCell>
                </WeekGroupBlock>
                <span className="text-muted-foreground flex items-center justify-center py-1.5 text-center text-[10px] font-medium uppercase tracking-wide">
                  Total
                </span>
              </div>

              <ul className="divide-border/60 divide-y">
                {times.rows.map((row) => (
                  <TimesRow
                    key={row.assignee}
                    assignee={row.assignee}
                    week1={row.week1}
                    week2={row.week2}
                    sprint={row.sprint}
                  />
                ))}

                <TimesRow
                  assignee="Total equipo"
                  week1={totals.week1}
                  week2={totals.week2}
                  sprint={totals.sprint}
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
