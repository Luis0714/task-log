import { EMPTY_HOURS_BREAKDOWN, type HoursBreakdown } from "@/lib/hours/hours-breakdown";
import { roundHours } from "@/lib/number/rounding";
import { resolveSemaforo } from "@/lib/reports/hours/compliance";
import type { SemaforoLevel } from "@/lib/reports/hours/hours-report-types";
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
import { resolveWeekExpectedHours } from "@/lib/sprints/filter-sprint-times-by-week";
import {
  sumSprintBreakdowns,
  sumWeekBreakdowns,
} from "@/lib/sprints/sum-hours-breakdowns";
import type {
  SprintTimesMetrics,
  SprintTimesPersonRow,
  SprintTimesWeekColumn,
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
  weekColumns: readonly SprintTimesWeekColumn[],
): SprintTimesShareTableRow {
  const weeks = row.weeks.map((week) => week ?? EMPTY_HOURS_BREAKDOWN);
  const weekTotal = focusWeekIndex === null ? null : weeks[focusWeekIndex] ?? EMPTY_HOURS_BREAKDOWN;
  const weekExpectedHours =
    focusWeekIndex === null
      ? null
      : resolveWeekExpectedHours(row, focusWeekIndex, weekColumns);
  const weekSemaforo = computeWeekSemaforo(weekTotal, weekExpectedHours);
  const weekCompliancePct = computeWeekPct(weekTotal, weekExpectedHours);

  return {
    assignee: row.assignee,
    weeks,
    sprint: row.sprint,
    weekTotal,
    expectedHours: row.expectedHours,
    compliancePct: row.compliancePct,
    semaforo: row.semaforo,
    weekExpectedHours,
    weekCompliancePct,
    weekSemaforo,
  };
}

function computeWeekPct(
  weekTotal: HoursBreakdown | null,
  weekExpected: number | null,
): number | null {
  if (!weekTotal || weekExpected === null || weekExpected <= 0) return null;
  const total = weekTotal.taskHours + weekTotal.bugHours + weekTotal.newsHours;
  return Math.round((total / weekExpected) * 1000) / 10;
}

function computeWeekSemaforo(
  weekTotal: HoursBreakdown | null,
  weekExpected: number | null,
): SemaforoLevel | null {
  const pct = computeWeekPct(weekTotal, weekExpected);
  if (pct === null) return null;
  return resolveSemaforo(pct);
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
    columns.push({ kind: "expectedHours" });
    columns.push({ kind: "sprintTotal" });
    columns.push({ kind: "compliance" });
    return columns;
  }

  const focusWeek = times.weeks[focusWeekIndex];
  if (focusWeek) {
    columns.push({ kind: "week", weekIndex: focusWeekIndex, week: focusWeek });
  }
  columns.push({ kind: "expectedHours" });
  columns.push({ kind: "weekTotal", label: SPRINT_TIMES_SHARE_LABELS.weekTotalColumn });
  columns.push({ kind: "compliance" });
  return columns;
}

function buildTableLayout(
  times: SprintTimesMetrics,
  variant: SprintTimesShareVariant,
): SprintTimesShareTableLayout {
  const focusWeekIndex = resolveFocusWeekIndex(times, variant);
  const rows = times.rows.map((row) =>
    mapPersonRow(row, focusWeekIndex, times.weeks),
  );

  const weekTotals = times.weeks.map((_, index) => sumWeekBreakdowns(times.rows, index));
  const sprintTotal = sumSprintBreakdowns(times.rows);
  const expectedHoursTotal = times.rows.reduce(
    (acc, row) => acc + row.expectedHours,
    0,
  );

  const teamTotalWeeks = weekTotals.map((week) => week ?? EMPTY_HOURS_BREAKDOWN);
  const teamTotalWeekTotal = focusWeekIndex === null
    ? null
    : (teamTotalWeeks[focusWeekIndex] ?? EMPTY_HOURS_BREAKDOWN);

  const teamTotalWeekExpected =
    focusWeekIndex === null
      ? null
      : roundHours(
          times.rows.reduce(
            (acc, row) => acc + resolveWeekExpectedHours(row, focusWeekIndex, times.weeks),
            0,
          ),
        );

  const teamTotalRow: SprintTimesShareTableRow = {
    assignee: SPRINT_TIMES_SHARE_LABELS.teamTotal,
    weeks: teamTotalWeeks,
    sprint: sprintTotal,
    weekTotal: teamTotalWeekTotal,
    expectedHours: expectedHoursTotal,
    compliancePct: null,
    semaforo: null,
    weekExpectedHours: teamTotalWeekExpected,
    weekCompliancePct: null,
    weekSemaforo: null,
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
