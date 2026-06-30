import {
  EMPTY_HOURS_BREAKDOWN,
  sumHoursBreakdownForDayKeys,
  totalHoursBreakdown,
} from "@/lib/dashboard/hours-breakdown";
import { listSprintWorkingDays, type SprintWorkingDay } from "@/lib/dashboard/sprint-days";
import {
  formatSprintWeekDateRange,
  splitSprintIntoWeeks,
} from "@/lib/dashboard/sprint-weeks";
import { findTeamMemberByAssigneeName } from "@/lib/filters/person-name";
import { mergeTeamMembersWithWorkItemAssignees } from "@/lib/filters/merge-team-members-with-assignees";
import type { AdoTeamMemberDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
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
  /** Roster del equipo + asignados del sprint (misma fuente que filtros de HUs y bugs). */
  assigneeRoster?: readonly AdoTeamMemberDto[];
};

export const EMPTY_SPRINT_TIMES_METRICS: SprintTimesMetrics = {
  weeks: [],
  rows: [],
};

function resolveTimesAssigneeLabel(
  roster: readonly AdoTeamMemberDto[],
  assignedTo: string | undefined | null,
): string {
  const trimmed = assignedTo?.trim();
  if (!trimmed) return SPRINT_BUG_UNASSIGNED_LABEL;
  return findTeamMemberByAssigneeName(roster, trimmed)?.displayName ?? trimmed;
}

function filterItemsByAssignee<T extends { assignedTo?: string }>(
  items: readonly T[],
  assigneeLabel: string,
  roster: readonly AdoTeamMemberDto[],
): T[] {
  return items.filter(
    (item) => resolveTimesAssigneeLabel(roster, item.assignedTo) === assigneeLabel,
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
  roster: readonly AdoTeamMemberDto[],
  week1DayKeys: readonly string[],
  week2DayKeys: readonly string[],
  allSprintDayKeys: readonly string[],
  sprintEndKey: string,
): SprintTimesPersonRow {
  const personTasks = filterItemsByAssignee(tasks, assignee, roster);
  const personBugs = filterItemsByAssignee(bugs, assignee, roster);

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
    allSprintDayKeys.length > 0
      ? sumHoursBreakdownForDayKeys(personTasks, personBugs, allSprintDayKeys, sprintEndKey)
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

function collectAssigneeLabelsFromWorkItems(
  tasks: readonly AdoWorkItemOptionDto[],
  bugs: readonly AdoWorkItemOptionDto[],
): string[] {
  const labels = new Set<string>();

  for (const item of [...tasks, ...bugs]) {
    labels.add(resolveSprintBugAssigneeLabel(item.assignedTo ?? null));
  }

  return [...labels];
}

function collectTimesAssigneeLabels(
  tasks: readonly AdoWorkItemOptionDto[],
  bugs: readonly AdoWorkItemOptionDto[],
  assigneeRoster: readonly AdoTeamMemberDto[],
): string[] {
  const scopedItems = [...tasks, ...bugs];
  const roster = mergeTeamMembersWithWorkItemAssignees(
    assigneeRoster,
    scopedItems.map((item) => ({ assignedTo: item.assignedTo })),
  );

  const assignees = roster.map((member) => member.displayName);

  const hasUnassigned = scopedItems.some((item) => !item.assignedTo?.trim());
  if (hasUnassigned) {
    assignees.push(SPRINT_BUG_UNASSIGNED_LABEL);
  }

  return assignees;
}

function resolveAssigneeLabels(
  tasks: readonly AdoWorkItemOptionDto[],
  bugs: readonly AdoWorkItemOptionDto[],
  assigneeRoster: readonly AdoTeamMemberDto[],
): string[] {
  if (assigneeRoster.length === 0) {
    return collectAssigneeLabelsFromWorkItems(tasks, bugs);
  }

  return collectTimesAssigneeLabels(tasks, bugs, assigneeRoster);
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

  const weekGroups = splitSprintIntoWeeks(workingDays);
  const firstWeekDays = weekGroups[0] ?? [];
  const secondWeekDays = weekGroups[1] ?? [];
  const week1DayKeys = firstWeekDays.map((day) => day.value);
  const week2DayKeys = secondWeekDays.map((day) => day.value);
  const allSprintDayKeys = workingDays.map((day) => day.value);
  const sprintEndKey = workingDays[workingDays.length - 1]?.value ?? "";

  const weeks = [
    buildWeekColumn(firstWeekDays, "Semana 1"),
    buildWeekColumn(secondWeekDays, "Semana 2"),
  ].filter((week): week is SprintTimesWeekColumn => week !== null);

  const assigneeRoster = input.assigneeRoster ?? [];
  const scopedItems = [...input.tasks, ...input.bugs];
  const roster = mergeTeamMembersWithWorkItemAssignees(
    assigneeRoster,
    scopedItems.map((item) => ({ assignedTo: item.assignedTo })),
  );
  const assignees = resolveAssigneeLabels(input.tasks, input.bugs, assigneeRoster);
  const rows = sortPersonRows(
    assignees.map((assignee) =>
      buildPersonRow(
        assignee,
        input.tasks,
        input.bugs,
        roster,
        week1DayKeys,
        week2DayKeys,
        allSprintDayKeys,
        sprintEndKey,
      ),
    ),
  );

  return { weeks, rows };
}
