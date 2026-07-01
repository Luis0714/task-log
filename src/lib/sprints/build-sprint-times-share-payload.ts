import { EMPTY_HOURS_BREAKDOWN } from "@/lib/dashboard/hours-breakdown";
import type { HoursBreakdown } from "@/lib/dashboard/hours-breakdown";
import { SITE_NAME } from "@/lib/seo/site";
import { formatSprintDateRange } from "@/lib/time-log/format-options";
import { SPRINT_TIMES_SHARE_LABELS } from "@/lib/sprints/sprint-times-share-labels";
import type {
  SprintTimesShareColumn,
  SprintTimesShareContext,
  SprintTimesSharePayload,
  SprintTimesShareTableLayout,
  SprintTimesShareTableRow,
} from "@/lib/sprints/sprint-times-share-types";
import {
  getSprintTimesShareVariantLabel,
  type SprintTimesShareVariant,
} from "@/lib/sprints/sprint-times-share-variant";
import type {
  SprintTimesMetrics,
  SprintTimesPersonRow,
  SprintTimesWeekColumn,
} from "@/lib/sprints/sprint-stats-types";

function defaultWeekMeta(index: number): SprintTimesWeekColumn {
  return {
    label: index === 0 ? "Semana 1" : "Semana 2",
    dateRangeLabel: "",
    workingDaysCount: 0,
  };
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

function buildScopeLabel(context: SprintTimesShareContext): string {
  const scopePrefix = context.goalOnly
    ? SPRINT_TIMES_SHARE_LABELS.scopeGoal
    : SPRINT_TIMES_SHARE_LABELS.scopeTeam;

  return `${scopePrefix} · ${context.projectName.trim()} · ${context.teamName.trim()} · ${context.sprintName.trim()}`;
}

function mapPersonRow(
  row: SprintTimesPersonRow,
  variant: SprintTimesShareVariant,
): SprintTimesShareTableRow {
  const week1 = row.weeks[0] ?? EMPTY_HOURS_BREAKDOWN;
  const week2 = row.weeks[1] ?? EMPTY_HOURS_BREAKDOWN;
  const weekTotal =
    variant === "week1" ? week1
    : variant === "week2" ? week2
    : null;

  return { assignee: row.assignee, week1, week2, sprint: row.sprint, weekTotal };
}

function buildColumns(
  times: SprintTimesMetrics,
  variant: SprintTimesShareVariant,
): SprintTimesShareColumn[] {
  const week1 = times.weeks[0] ?? defaultWeekMeta(0);
  const week2 = times.weeks[1] ?? defaultWeekMeta(1);
  const columns: SprintTimesShareColumn[] = [{ kind: "assignee" }];

  if (variant === "full") {
    columns.push({ kind: "week", weekKey: "week1", week: week1 });
    if (times.weeks.length >= 2) {
      columns.push({ kind: "week", weekKey: "week2", week: week2 });
    }
    columns.push({ kind: "sprintTotal" });
    return columns;
  }

  if (variant === "week1") {
    columns.push({ kind: "week", weekKey: "week1", week: week1 });
    columns.push({ kind: "weekTotal", label: SPRINT_TIMES_SHARE_LABELS.weekTotalColumn });
    return columns;
  }

  columns.push({ kind: "week", weekKey: "week2", week: week2 });
  columns.push({ kind: "weekTotal", label: SPRINT_TIMES_SHARE_LABELS.weekTotalColumn });
  return columns;
}

function buildTableLayout(
  times: SprintTimesMetrics,
  variant: SprintTimesShareVariant,
): SprintTimesShareTableLayout {
  const rows = times.rows.map((row) => mapPersonRow(row, variant));
  const week1Total = sumWeekBreakdowns(times.rows, 0);
  const week2Total = sumWeekBreakdowns(times.rows, 1);
  const sprintTotal = sumSprintBreakdowns(times.rows);

  const teamTotalRow: SprintTimesShareTableRow = {
    assignee: SPRINT_TIMES_SHARE_LABELS.teamTotal,
    week1: week1Total,
    week2: week2Total,
    sprint: sprintTotal,
    weekTotal:
      variant === "week1" ? week1Total
      : variant === "week2" ? week2Total
      : null,
    emphasized: true,
  };

  return {
    columns: buildColumns(times, variant),
    rows,
    teamTotalRow,
  };
}

export function buildSprintTimesSharePayload(
  times: SprintTimesMetrics,
  context: SprintTimesShareContext,
  generatedAt: Date = new Date(),
): SprintTimesSharePayload {
  return {
    generatedAt,
    platformName: SITE_NAME,
    projectName: context.projectName.trim(),
    teamName: context.teamName.trim(),
    sprintName: context.sprintName.trim(),
    sprintDateRange: formatSprintDateRange(context.sprintStartDate, context.sprintFinishDate),
    variant: context.variant,
    variantLabel: getSprintTimesShareVariantLabel(context.variant),
    scopeLabel: buildScopeLabel(context),
    dataSourceLabel: context.dataSourceLabel.trim(),
    table: buildTableLayout(times, context.variant),
  };
}
