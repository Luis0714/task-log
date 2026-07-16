"use client";

import { useMemo } from "react";

import {
  buildSprintTimesColumns,
  SPRINT_TIMES_FIXED_RIGHT_REM,
  SPRINT_TIMES_PERSON_COLUMN_REM,
  SPRINT_TIMES_TEAM_TOTAL_LABEL,
  SPRINT_TIMES_WEEK_COLUMN_REM,
} from "@/components/sprints/stats/sprint-times-columns";
import { SprintTimesRowCard } from "@/components/sprints/stats/sprint-times-row-card";
import { StickyTable } from "@/components/ui/sticky-table";
import type {
  SprintTimesMetrics,
  SprintTimesPersonRow,
} from "@/lib/sprints/sprint-stats-types";

export type SprintTimesTableProps = {
  times: SprintTimesMetrics;
  totalRow: SprintTimesPersonRow;
};

function tableMinWidthRem(weekCount: number): number {
  return (
    SPRINT_TIMES_PERSON_COLUMN_REM +
    SPRINT_TIMES_FIXED_RIGHT_REM +
    weekCount * SPRINT_TIMES_WEEK_COLUMN_REM
  );
}

export function SprintTimesTable({
  times,
  totalRow,
}: Readonly<SprintTimesTableProps>) {
  const columns = useMemo(() => buildSprintTimesColumns(times.weeks), [times.weeks]);
  const rows = useMemo(() => [...times.rows, totalRow], [times.rows, totalRow]);

  return (
    <StickyTable
      columns={columns}
      rows={rows}
      getRowKey={(row) => row.assignee}
      tableStyle={{ minWidth: `${tableMinWidthRem(times.weeks.length)}rem` }}
      rowClassName={(row) =>
        row.assignee === SPRINT_TIMES_TEAM_TOTAL_LABEL ? "bg-muted/20" : ""
      }
      renderCard={(row) => <SprintTimesRowCard row={row} weeks={times.weeks} />}
    />
  );
}
