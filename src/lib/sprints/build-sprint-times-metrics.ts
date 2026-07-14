import { computeHoursBreakdown } from "@/lib/hours/aggregate-hours";
import {
  EMPTY_HOURS_BREAKDOWN,
  totalHoursBreakdown,
  type HoursBreakdown,
} from "@/lib/hours/hours-breakdown";
import { listSprintWorkingDays, type SprintWorkingDay } from "@/lib/dashboard/sprint-days";
import {
  formatSprintWeekDateRange,
  splitSprintIntoWeeks,
} from "@/lib/dashboard/sprint-weeks";
import { findTeamMemberByAssigneeName } from "@/lib/filters/person-name";
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

function buildWeekBreakdown(
  tasks: AdoWorkItemOptionDto[],
  bugs: AdoWorkItemOptionDto[],
  dayKeys: readonly string[],
): HoursBreakdown {
  if (dayKeys.length === 0) return EMPTY_HOURS_BREAKDOWN;
  return computeHoursBreakdown({ tasks, bugs, workingDayKeys: new Set(dayKeys) });
}

function buildPersonRow(
  assignee: string,
  tasks: readonly AdoWorkItemOptionDto[],
  bugs: readonly AdoWorkItemOptionDto[],
  roster: readonly AdoTeamMemberDto[],
  weekDayKeys: readonly (readonly string[])[],
  allSprintDayKeys: readonly string[],
): SprintTimesPersonRow {
  const personTasks = filterItemsByAssignee(tasks, assignee, roster);
  const personBugs = filterItemsByAssignee(bugs, assignee, roster);

  const weeks = weekDayKeys.map((dayKeys) =>
    buildWeekBreakdown(personTasks, personBugs, dayKeys),
  );

  const sprint = buildWeekBreakdown(personTasks, personBugs, allSprintDayKeys);

  return {
    assignee,
    weeks,
    sprint,
  };
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

/**
 * Fallback defensivo: si un work item tiene horas de alguien que ya no
 * está en el roster (p. ej. persona dada de baja pero con tareas
 * registradas), lo agregamos al roster local para que sus horas no se
 * pierdan del reporte. Sin llamada extra a ADO.
 */
function ensureRosterCoversItems(
  roster: readonly AdoTeamMemberDto[],
  items: readonly AdoWorkItemOptionDto[],
): AdoTeamMemberDto[] {
  const seen = new Set(roster.map((member) => member.displayName));
  const extras: AdoTeamMemberDto[] = [];

  for (const item of items) {
    const name = item.assignedTo?.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    extras.push({ id: `sprint-assignee:${name}`, displayName: name });
  }

  return [...roster, ...extras];
}

function collectTimesAssigneeLabels(
  tasks: readonly AdoWorkItemOptionDto[],
  bugs: readonly AdoWorkItemOptionDto[],
  assigneeRoster: readonly AdoTeamMemberDto[],
): string[] {
  const scopedItems = [...tasks, ...bugs];
  const roster = ensureRosterCoversItems(assigneeRoster, scopedItems);

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
  const weekDayKeys = weekGroups.map((days) => days.map((day) => day.value));
  const allSprintDayKeys = workingDays.map((day) => day.value);

  const weeks = weekGroups
    .map((days, index) => buildWeekColumn(days, `Semana ${index + 1}`))
    .filter((week): week is SprintTimesWeekColumn => week !== null);

  const assigneeRoster = input.assigneeRoster ?? [];
  const scopedItems = [...input.tasks, ...input.bugs];
  const roster = ensureRosterCoversItems(assigneeRoster, scopedItems);
  const assignees = resolveAssigneeLabels(input.tasks, input.bugs, assigneeRoster);
  const rows = sortPersonRows(
    assignees.map((assignee) =>
      buildPersonRow(assignee, input.tasks, input.bugs, roster, weekDayKeys, allSprintDayKeys),
    ),
  );

  return { weeks, rows };
}
