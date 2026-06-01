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
  const weekTotal =
    variant === "week1"
      ? row.week1
      : variant === "week2"
        ? row.week2
        : null;

  return {
    assignee: row.assignee,
    week1: row.week1,
    week2: row.week2,
    sprint: row.sprint,
    weekTotal,
  };
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
  const totals = {
    week1: sumBreakdowns(times.rows, "week1"),
    week2: sumBreakdowns(times.rows, "week2"),
    sprint: sumBreakdowns(times.rows, "sprint"),
  };

  const teamTotalRow: SprintTimesShareTableRow = {
    assignee: SPRINT_TIMES_SHARE_LABELS.teamTotal,
    week1: totals.week1,
    week2: totals.week2,
    sprint: totals.sprint,
    weekTotal:
      variant === "week1"
        ? totals.week1
        : variant === "week2"
          ? totals.week2
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
