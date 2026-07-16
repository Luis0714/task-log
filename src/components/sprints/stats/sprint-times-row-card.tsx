"use client";

import { weekGroupClass } from "@/components/sprints/stats/sprint-times-columns";
import {
  SprintTimesBugHoursValue,
  SprintTimesComplianceBadge,
  SprintTimesDevHoursValue,
  SprintTimesNewsHoursValue,
  SprintTimesWeekTotalValue,
} from "@/components/sprints/stats/sprint-times-hours-cell";
import { TeamMemberAvatar } from "@/components/team-members/team-member-avatar";
import { formatHours } from "@/lib/dashboard/format-hours";
import { EMPTY_HOURS_BREAKDOWN, totalHoursBreakdown } from "@/lib/hours/hours-breakdown";
import type {
  SprintTimesPersonRow,
  SprintTimesWeekColumn,
} from "@/lib/sprints/sprint-stats-types";
import { cn } from "@/lib/utils";

export type SprintTimesRowCardProps = {
  row: SprintTimesPersonRow;
  weeks: readonly SprintTimesWeekColumn[];
};

export function SprintTimesRowCard({
  row,
  weeks,
}: Readonly<SprintTimesRowCardProps>) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <TeamMemberAvatar name={row.assignee} size="sm" />
          <p className="truncate text-sm font-medium" title={row.assignee}>
            {row.assignee}
          </p>
        </div>
        <SprintTimesComplianceBadge level={row.semaforo} pct={row.compliancePct} />
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span>
          Esperadas:{" "}
          <span className="text-foreground tabular-nums">
            {formatHours(row.expectedHours)}
          </span>
        </span>
        <span>
          Total:{" "}
          <span className="text-foreground font-semibold tabular-nums">
            {formatHours(totalHoursBreakdown(row.sprint))}
          </span>
        </span>
      </div>

      <ul className="flex flex-col gap-1">
        {weeks.map((week, index) => {
          const breakdown = row.weeks[index] ?? EMPTY_HOURS_BREAKDOWN;
          return (
            <li
              key={week.label}
              className={cn(
                "flex flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-md px-2 py-1.5",
                weekGroupClass(index),
              )}
            >
              <span className="text-muted-foreground text-[11px] font-medium">
                {week.label}
              </span>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <SprintTimesDevHoursValue value={breakdown.taskHours} />
                <SprintTimesBugHoursValue value={breakdown.bugHours} />
                <SprintTimesNewsHoursValue value={breakdown.newsHours} />
                <SprintTimesWeekTotalValue value={totalHoursBreakdown(breakdown)} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
