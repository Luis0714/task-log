import { EMPTY_HOURS_BREAKDOWN } from "@/lib/hours/hours-breakdown";
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
  getSprintTimesShareWeekDateRange,
  isFullSprintTimesShareVariant,
  parseSprintTimesShareWeekIndex,
  type SprintTimesShareVariant,
} from "@/lib/sprints/sprint-times-share-variant";
import { filterSprintTimesByVisibility } from "@/lib/sprints/filter-sprint-times-by-visibility";
import {
  sumSprintBreakdowns,
  sumWeekBreakdowns,
} from "@/lib/sprints/sum-hours-breakdowns";
import type {
  SprintTimesMetrics,
  SprintTimesPersonRow,
} from "@/lib/sprints/sprint-stats-types";

function buildScopeLabel(context: SprintTimesShareContext): string {
  const scopePrefix = context.goalOnly
    ? SPRINT_TIMES_SHARE_LABELS.scopeGoal
    : SPRINT_TIMES_SHARE_LABELS.scopeTeam;

  return `${scopePrefix} · ${context.projectName.trim()} · ${context.teamName.trim()} · ${context.sprintName.trim()}`;
}

function resolveFocusWeekIndex(
  times: SprintTimesMetrics,
  variant: SprintTimesShareVariant,
): number | null {
  if (isFullSprintTimesShareVariant(variant)) return null;
  const weekIndex = parseSprintTimesShareWeekIndex(variant);
  if (weekIndex === null) return null;
  if (weekIndex < 1 || weekIndex > times.weeks.length) return null;
  return weekIndex - 1;
}

function mapPersonRow(
  row: SprintTimesPersonRow,
  focusWeekIndex: number | null,
): SprintTimesShareTableRow {
  const weeks = row.weeks.map((week) => week ?? EMPTY_HOURS_BREAKDOWN);
  const weekTotal = focusWeekIndex === null ? null : weeks[focusWeekIndex] ?? EMPTY_HOURS_BREAKDOWN;

  return { assignee: row.assignee, weeks, sprint: row.sprint, weekTotal };
}

function buildColumns(
  times: SprintTimesMetrics,
  variant: SprintTimesShareVariant,
): SprintTimesShareColumn[] {
  const columns: SprintTimesShareColumn[] = [{ kind: "assignee" }];
  const focusWeekIndex = resolveFocusWeekIndex(times, variant);

  if (focusWeekIndex === null) {
    times.weeks.forEach((week, index) => {
      columns.push({ kind: "week", weekIndex: index, week });
    });
    columns.push({ kind: "sprintTotal" });
    return columns;
  }

  const focusWeek = times.weeks[focusWeekIndex];
  if (focusWeek) {
    columns.push({ kind: "week", weekIndex: focusWeekIndex, week: focusWeek });
  }
  columns.push({ kind: "weekTotal", label: SPRINT_TIMES_SHARE_LABELS.weekTotalColumn });
  return columns;
}

function buildTableLayout(
  times: SprintTimesMetrics,
  variant: SprintTimesShareVariant,
): SprintTimesShareTableLayout {
  const focusWeekIndex = resolveFocusWeekIndex(times, variant);
  const rows = times.rows.map((row) => mapPersonRow(row, focusWeekIndex));

  const weekTotals = times.weeks.map((_, index) => sumWeekBreakdowns(times.rows, index));
  const sprintTotal = sumSprintBreakdowns(times.rows);

  const teamTotalWeeks = weekTotals.map((week) => week ?? EMPTY_HOURS_BREAKDOWN);
  const teamTotalWeekTotal = focusWeekIndex === null
    ? null
    : (teamTotalWeeks[focusWeekIndex] ?? EMPTY_HOURS_BREAKDOWN);

  const teamTotalRow: SprintTimesShareTableRow = {
    assignee: SPRINT_TIMES_SHARE_LABELS.teamTotal,
    weeks: teamTotalWeeks,
    sprint: sprintTotal,
    weekTotal: teamTotalWeekTotal,
    emphasized: true,
  };

  return {
    columns: buildColumns(times, variant),
    rows,
    teamTotalRow,
  };
}

function resolveSprintDateRange(
  times: SprintTimesMetrics,
  context: SprintTimesShareContext,
): string | null {
  const weekRange = getSprintTimesShareWeekDateRange(times, context.variant);
  if (weekRange) return weekRange;
  return formatSprintDateRange(context.sprintStartDate, context.sprintFinishDate);
}

export function buildSprintTimesSharePayload(
  times: SprintTimesMetrics,
  context: SprintTimesShareContext,
  generatedAt: Date = new Date(),
): SprintTimesSharePayload {
  const visibleTimes = filterSprintTimesByVisibility(
    times,
    new Set(context.hiddenAssignees),
  );
  return {
    generatedAt,
    platformName: SITE_NAME,
    projectName: context.projectName.trim(),
    teamName: context.teamName.trim(),
    sprintName: context.sprintName.trim(),
    sprintDateRange: resolveSprintDateRange(visibleTimes, context),
    variant: context.variant,
    variantLabel: getSprintTimesShareVariantLabel(context.variant, visibleTimes),
    scopeLabel: buildScopeLabel(context),
    dataSourceLabel: context.dataSourceLabel.trim(),
    table: buildTableLayout(visibleTimes, context.variant),
  };
}
