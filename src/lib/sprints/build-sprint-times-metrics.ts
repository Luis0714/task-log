import {
  EMPTY_HOURS_BREAKDOWN,
  sumHoursBreakdownForDayKeys,
  sumHoursBreakdownThroughDay,
  totalHoursBreakdown,
} from "@/lib/dashboard/hours-breakdown";
import { listSprintWorkingDays, type SprintWorkingDay } from "@/lib/dashboard/sprint-days";
import {
  formatSprintWeekDateRange,
  splitSprintIntoWeeks,
} from "@/lib/dashboard/sprint-weeks";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import {
  resolveSprintBugAssigneeLabel,
  SPRINT_BUG_UNASSIGNED_LABEL,
} from "@/lib/sprints/filter-sprint-bug-detail-items";
import type {
  SprintTimesMetrics,
  SprintTimesPersonRow,
  SprintTimesWeekColumn,
} from "@/lib/sprints/sprint-stats-types";

export type BuildSprintTimesMetricsInput = {
  tasks: readonly AdoWorkItemOptionDto[];
  bugs: readonly AdoWorkItemOptionDto[];
  sprintStartDate?: string | null;
  sprintFinishDate?: string | null;
  nonWorkingDates?: readonly string[];
};

export const EMPTY_SPRINT_TIMES_METRICS: SprintTimesMetrics = {
  weeks: [],
  rows: [],
};

function filterItemsByAssignee<T extends { assignedTo?: string }>(
  items: readonly T[],
  assigneeLabel: string,
): T[] {
  return items.filter(
    (item) => resolveSprintBugAssigneeLabel(item.assignedTo ?? null) === assigneeLabel,
  );
}

function buildWeekColumn(
  days: SprintWorkingDay[],
  label: string,
): SprintTimesWeekColumn | null {
  if (days.length === 0) return null;

  return {
    label,
    dateRangeLabel: formatSprintWeekDateRange(days),
    workingDaysCount: days.length,
  };
}

function buildPersonRow(
  assignee: string,
  tasks: readonly AdoWorkItemOptionDto[],
  bugs: readonly AdoWorkItemOptionDto[],
  week1DayKeys: readonly string[],
  week2DayKeys: readonly string[],
  sprintEndKey: string,
): SprintTimesPersonRow {
  const personTasks = filterItemsByAssignee(tasks, assignee);
  const personBugs = filterItemsByAssignee(bugs, assignee);

  const week1EndKey = week1DayKeys[week1DayKeys.length - 1] ?? "";
  const week2EndKey = week2DayKeys[week2DayKeys.length - 1] ?? "";

  const week1 =
    week1DayKeys.length > 0 && week1EndKey
      ? sumHoursBreakdownForDayKeys(personTasks, personBugs, week1DayKeys, week1EndKey)
      : EMPTY_HOURS_BREAKDOWN;

  const week2 =
    week2DayKeys.length > 0 && week2EndKey
      ? sumHoursBreakdownForDayKeys(personTasks, personBugs, week2DayKeys, week2EndKey)
      : EMPTY_HOURS_BREAKDOWN;

  const sprint =
    sprintEndKey !== ""
      ? sumHoursBreakdownThroughDay(personTasks, personBugs, sprintEndKey)
      : EMPTY_HOURS_BREAKDOWN;

  return { assignee, week1, week2, sprint };
}

function sortPersonRows(rows: SprintTimesPersonRow[]): SprintTimesPersonRow[] {
  return [...rows].sort((left, right) => {
    const totalDiff =
      totalHoursBreakdown(right.sprint) - totalHoursBreakdown(left.sprint);
    if (totalDiff !== 0) return totalDiff;

    if (left.assignee === SPRINT_BUG_UNASSIGNED_LABEL) return 1;
    if (right.assignee === SPRINT_BUG_UNASSIGNED_LABEL) return -1;

    return left.assignee.localeCompare(right.assignee, "es");
  });
}

function collectAssigneeLabels(
  tasks: readonly AdoWorkItemOptionDto[],
  bugs: readonly AdoWorkItemOptionDto[],
): string[] {
  const labels = new Set<string>();

  for (const item of [...tasks, ...bugs]) {
    labels.add(resolveSprintBugAssigneeLabel(item.assignedTo ?? null));
  }

  return [...labels];
}

export function buildSprintTimesMetrics(
  input: BuildSprintTimesMetricsInput,
): SprintTimesMetrics {
  const workingDays = listSprintWorkingDays(
    input.sprintStartDate ?? undefined,
    input.sprintFinishDate ?? undefined,
    { nonWorkingDates: new Set(input.nonWorkingDates ?? []) },
  );

  if (workingDays.length === 0) {
    return EMPTY_SPRINT_TIMES_METRICS;
  }

  const [firstWeekDays, secondWeekDays] = splitSprintIntoWeeks(workingDays);
  const week1DayKeys = firstWeekDays.map((day) => day.value);
  const week2DayKeys = secondWeekDays.map((day) => day.value);
  const sprintEndKey = workingDays[workingDays.length - 1]?.value ?? "";

  const weeks = [
    buildWeekColumn(firstWeekDays, "Semana 1"),
    buildWeekColumn(secondWeekDays, "Semana 2"),
  ].filter((week): week is SprintTimesWeekColumn => week !== null);

  const assignees = collectAssigneeLabels(input.tasks, input.bugs);
  const rows = sortPersonRows(
    assignees
      .map((assignee) =>
        buildPersonRow(
          assignee,
          input.tasks,
          input.bugs,
          week1DayKeys,
          week2DayKeys,
          sprintEndKey,
        ),
      )
      .filter((row) => totalHoursBreakdown(row.sprint) > 0),
  );

  return { weeks, rows };
}
