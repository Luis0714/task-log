"use client";

import type { ReactNode } from "react";

import {
  SprintTimesBugHoursValue,
  SprintTimesBugSubColumnHeader,
  SprintTimesComplianceBadge,
  SprintTimesDevHoursValue,
  SprintTimesDevSubColumnHeader,
  SprintTimesExpectedHoursValue,
  SprintTimesNewsHoursValue,
  SprintTimesNewsSubColumnHeader,
  SprintTimesTotalSubColumnHeader,
  SprintTimesWeekTotalValue,
} from "@/components/sprints/stats/sprint-times-hours-cell";
import type { StickyTableColumn } from "@/components/ui/sticky-table";
import { TruncatedTextTooltip } from "@/components/ui/truncated-text-tooltip";
import { TeamMemberAvatar } from "@/components/team-members/team-member-avatar";
import { EMPTY_HOURS_BREAKDOWN, totalHoursBreakdown } from "@/lib/hours/hours-breakdown";
import type {
  SprintTimesPersonRow,
  SprintTimesWeekColumn,
} from "@/lib/sprints/sprint-stats-types";
import { cn } from "@/lib/utils";

export const SPRINT_TIMES_TEAM_TOTAL_LABEL = "Total equipo";

export const SPRINT_TIMES_PERSON_COLUMN_REM = 11;
export const SPRINT_TIMES_WEEK_COLUMN_REM = 18;
export const SPRINT_TIMES_FIXED_RIGHT_REM = 17;

const WEEK_ODD_CLASS = "bg-primary/[0.07]";
const WEEK_EVEN_CLASS = "bg-muted/50";
const WEEK_ODD_EMPHASIZED = "bg-primary/[0.1]";
const WEEK_EVEN_EMPHASIZED = "bg-muted/65";

const RIGHT_HEADER_CLASS =
  "text-muted-foreground text-center text-[10px] font-medium uppercase tracking-wide whitespace-normal align-bottom";

export function weekGroupClass(weekIndex: number, emphasized = false): string {
  const isOdd = weekIndex % 2 === 0;
  if (emphasized) return isOdd ? WEEK_ODD_EMPHASIZED : WEEK_EVEN_EMPHASIZED;
  return isOdd ? WEEK_ODD_CLASS : WEEK_EVEN_CLASS;
}

function isTeamTotalRow(row: SprintTimesPersonRow): boolean {
  return row.assignee === SPRINT_TIMES_TEAM_TOTAL_LABEL;
}

function WeekGroupCell({
  children,
  withDivider = false,
}: Readonly<{
  children: ReactNode;
  withDivider?: boolean;
}>) {
  return (
    <div
      className={cn(
        "flex items-center justify-center px-1 py-2",
        withDivider && "border-border/20 border-l",
      )}
    >
      {children}
    </div>
  );
}

function WeekGroupHeader({
  week,
  weekIndex,
}: Readonly<{ week: SprintTimesWeekColumn; weekIndex: number }>) {
  return (
    <div className={cn("rounded-md pt-1.5", weekGroupClass(weekIndex))}>
      <p className="text-xs font-medium">{week.label}</p>
      {week.dateRangeLabel ? (
        <p className="text-muted-foreground truncate text-[10px] font-normal">
          {week.dateRangeLabel}
        </p>
      ) : null}
      <p className="text-muted-foreground text-[10px] font-normal">
        {week.workingDaysCount} {week.workingDaysCount === 1 ? "día hábil" : "días hábiles"}
      </p>
      <div className="grid grid-cols-4 pb-1">
        <WeekGroupCell>
          <SprintTimesDevSubColumnHeader />
        </WeekGroupCell>
        <WeekGroupCell withDivider>
          <SprintTimesBugSubColumnHeader />
        </WeekGroupCell>
        <WeekGroupCell withDivider>
          <SprintTimesNewsSubColumnHeader />
        </WeekGroupCell>
        <WeekGroupCell withDivider>
          <SprintTimesTotalSubColumnHeader />
        </WeekGroupCell>
      </div>
    </div>
  );
}

function WeekGroupValues({
  row,
  weekIndex,
}: Readonly<{ row: SprintTimesPersonRow; weekIndex: number }>) {
  const breakdown = row.weeks[weekIndex] ?? EMPTY_HOURS_BREAKDOWN;

  return (
    <div
      className={cn(
        "grid grid-cols-4 rounded-md",
        weekGroupClass(weekIndex, isTeamTotalRow(row)),
      )}
    >
      <WeekGroupCell>
        <SprintTimesDevHoursValue value={breakdown.taskHours} className="w-full" />
      </WeekGroupCell>
      <WeekGroupCell withDivider>
        <SprintTimesBugHoursValue value={breakdown.bugHours} className="w-full" />
      </WeekGroupCell>
      <WeekGroupCell withDivider>
        <SprintTimesNewsHoursValue value={breakdown.newsHours} className="w-full" />
      </WeekGroupCell>
      <WeekGroupCell withDivider>
        <SprintTimesWeekTotalValue value={totalHoursBreakdown(breakdown)} />
      </WeekGroupCell>
    </div>
  );
}

function buildPersonColumn(): StickyTableColumn<SprintTimesPersonRow> {
  return {
    key: "persona",
    header: "Persona",
    widthClass: "w-44",
    sticky: { leftClass: "left-0", isLast: true },
    align: "left",
    headerClassName: "text-muted-foreground align-bottom text-xs",
    render: (row) => (
      <div className="flex min-w-0 items-center gap-2">
        <TeamMemberAvatar name={row.assignee} size="sm" />
        <TruncatedTextTooltip text={row.assignee} className="text-sm font-medium" />
      </div>
    ),
  };
}

function buildWeekColumns(
  weeks: readonly SprintTimesWeekColumn[],
): StickyTableColumn<SprintTimesPersonRow>[] {
  return weeks.map((week, index) => ({
    key: `semana-${index}`,
    header: <WeekGroupHeader week={week} weekIndex={index} />,
    widthClass: "w-72",
    align: "center",
    headerClassName: "px-1.5 py-1.5 align-bottom",
    bodyClassName: "px-1.5 py-1",
    render: (row) => <WeekGroupValues row={row} weekIndex={index} />,
  }));
}

function buildFixedRightColumns(): StickyTableColumn<SprintTimesPersonRow>[] {
  return [
    {
      key: "esperadas",
      header: "H. Esperadas",
      widthClass: "w-20",
      sticky: { rightClass: "right-48", isLast: true },
      align: "center",
      headerClassName: RIGHT_HEADER_CLASS,
      bodyClassName: "text-center",
      render: (row) => <SprintTimesExpectedHoursValue value={row.expectedHours} />,
    },
    {
      key: "totales",
      header: "H. Totales",
      widthClass: "w-20",
      sticky: { rightClass: "right-28" },
      align: "center",
      headerClassName: RIGHT_HEADER_CLASS,
      bodyClassName: "text-center",
      render: (row) => (
        <SprintTimesWeekTotalValue value={totalHoursBreakdown(row.sprint)} />
      ),
    },
    {
      key: "cumplimiento",
      header: "% Cumplimiento",
      widthClass: "w-28",
      sticky: { rightClass: "right-0" },
      align: "center",
      headerClassName: RIGHT_HEADER_CLASS,
      bodyClassName: "text-center",
      render: (row) => (
        <SprintTimesComplianceBadge level={row.semaforo} pct={row.compliancePct} />
      ),
    },
  ];
}

export function buildSprintTimesColumns(
  weeks: readonly SprintTimesWeekColumn[],
): StickyTableColumn<SprintTimesPersonRow>[] {
  return [buildPersonColumn(), ...buildWeekColumns(weeks), ...buildFixedRightColumns()];
}
