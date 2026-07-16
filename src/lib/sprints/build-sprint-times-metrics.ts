import { computeHoursBreakdown } from "@/lib/hours/aggregate-hours";
import { computeCompliance } from "@/lib/reports/hours/compliance";
import {
  EMPTY_HOURS_BREAKDOWN,
  totalHoursBreakdown,
  type HoursBreakdown,
} from "@/lib/hours/hours-breakdown";
import { computeExpectedHours, type AssignmentSegment } from "@/lib/expected-hours";
import { listSprintWorkingDays, type SprintWorkingDay } from "@/lib/dashboard/sprint-days";
import {
  formatSprintWeekDateRange,
  splitSprintIntoWeeks,
} from "@/lib/dashboard/sprint-weeks";
import { findTeamMemberByAssigneeName } from "@/lib/filters/person-name";
import type { AdoTeamMemberDto, AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import {
  buildSprintNewsHoursByWeek,
  type SprintNewsSolicitud,
} from "@/lib/sprints/build-sprint-news-hours-by-week";
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
  assigneeRoster?: readonly AdoTeamMemberDto[];
  /**
   * Segmentos de asignación por assignee (mismas reglas del reporte por
   * periodo), pre-cargados con `loadTeamAssignmentSegmentsByAssignee` para
   * mantener el builder puro de dependencias de BD. Un assignee sin entrada
   * se asume al 100% (D17/D18).
   */
  assignmentSegmentsByAssignee?: ReadonlyMap<string, readonly AssignmentSegment[]>;
  /**
   * Novedades que se cruzan con el sprint, pre-cargadas con
   * `loadSprintNewsSolicitudes`. Sus horas se reparten por semana igual que
   * en el reporte por periodo.
   */
  newsSolicitudes?: readonly SprintNewsSolicitud[];
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

function readNewsHours(
  innerWeekMap: ReadonlyMap<string, number> | undefined,
  weekKey: string,
): number {
  if (!innerWeekMap) return 0;
  return innerWeekMap.get(weekKey) ?? 0;
}

function buildWeekBreakdown(
  tasks: AdoWorkItemOptionDto[],
  bugs: AdoWorkItemOptionDto[],
  dayKeys: readonly string[],
  newsHours: number,
): HoursBreakdown {
  if (dayKeys.length === 0 && newsHours === 0) return EMPTY_HOURS_BREAKDOWN;
  const base = dayKeys.length === 0
    ? EMPTY_HOURS_BREAKDOWN
    : computeHoursBreakdown({ tasks, bugs, workingDayKeys: new Set(dayKeys) });
  return { ...base, newsHours };
}

/**
 * Sin segmentos cargados, toda persona cuenta al 100% (D17/D18: nunca
 * "Sin configurar"). La única excepción es la fila sintética "Sin asignar",
 * que no es una persona y queda sin horas esperadas.
 */
function resolveSegmentsForAssignee(
  assignee: string,
  segmentsByAssignee: ReadonlyMap<string, readonly AssignmentSegment[]> | undefined,
  sprintStartKey: string,
): readonly AssignmentSegment[] {
  if (assignee === SPRINT_BUG_UNASSIGNED_LABEL) return [];
  const loaded = segmentsByAssignee?.get(assignee);
  if (loaded && loaded.length > 0) return loaded;
  return [{ pct: 100, from: sprintStartKey, to: null }];
}

function buildPersonRow(args: {
  assignee: string;
  tasks: readonly AdoWorkItemOptionDto[];
  bugs: readonly AdoWorkItemOptionDto[];
  roster: readonly AdoTeamMemberDto[];
  weekDayKeys: readonly (readonly string[])[];
  weekKeys: readonly string[];
  allSprintDayKeys: readonly string[];
  segments: readonly AssignmentSegment[];
  newsByWeek: ReadonlyMap<string, number> | undefined;
}): SprintTimesPersonRow {
  const personTasks = filterItemsByAssignee(args.tasks, args.assignee, args.roster);
  const personBugs = filterItemsByAssignee(args.bugs, args.assignee, args.roster);

  const weeks = args.weekDayKeys.map((dayKeys, index) =>
    buildWeekBreakdown(
      personTasks,
      personBugs,
      dayKeys,
      readNewsHours(args.newsByWeek, args.weekKeys[index] ?? ""),
    ),
  );

  const sprintNewsHours = args.weekKeys.reduce(
    (total, weekKey) => total + readNewsHours(args.newsByWeek, weekKey),
    0,
  );

  const sprintBase = args.allSprintDayKeys.length === 0
    ? EMPTY_HOURS_BREAKDOWN
    : computeHoursBreakdown({
        tasks: personTasks,
        bugs: personBugs,
        workingDayKeys: new Set(args.allSprintDayKeys),
      });

  const sprint: HoursBreakdown = { ...sprintBase, newsHours: sprintNewsHours };
  const totalReported = totalHoursBreakdown(sprint);

  const expectedHours = computeExpectedHours(
    args.allSprintDayKeys,
    args.segments,
  ).expectedHours;
  const expectedHoursByWeek = args.weekDayKeys.map(
    (dayKeys) => computeExpectedHours(dayKeys, args.segments).expectedHours,
  );
  const { pct, level } = computeCompliance(totalReported, expectedHours);

  return {
    assignee: args.assignee,
    weeks,
    sprint,
    expectedHours,
    expectedHoursByWeek,
    compliancePct: pct,
    semaforo: level,
  };
}

function sortPersonRows(rows: SprintTimesPersonRow[]): SprintTimesPersonRow[] {
  return [...rows].sort((left, right) => {
    // 1) % de cumplimiento descendente (nulos al final).
    const complianceDiff = compareComplianceDesc(left.compliancePct, right.compliancePct);
    if (complianceDiff !== 0) return complianceDiff;

    // 2) Total de horas del sprint descendente como desempate.
    const totalDiff =
      totalHoursBreakdown(right.sprint) - totalHoursBreakdown(left.sprint);
    if (totalDiff !== 0) return totalDiff;

    // 3) "Sin asignar" al final, luego alfabético por nombre.
    if (left.assignee === SPRINT_BUG_UNASSIGNED_LABEL) return 1;
    if (right.assignee === SPRINT_BUG_UNASSIGNED_LABEL) return -1;

    return left.assignee.localeCompare(right.assignee, "es");
  });
}

function compareComplianceDesc(
  left: number | null,
  right: number | null,
): number {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return right - left;
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

function resolveAssigneeLabels(
  tasks: readonly AdoWorkItemOptionDto[],
  bugs: readonly AdoWorkItemOptionDto[],
  assigneeRoster: readonly AdoTeamMemberDto[],
): string[] {
  if (assigneeRoster.length === 0) {
    return collectAssigneeLabelsFromWorkItems(tasks, bugs);
  }

  return assigneeRoster.map((member) => member.displayName);
}

const ISO_DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

function isoDateOnly(value: string): string | null {
  if (!ISO_DATE_ONLY.test(value)) return null;
  return value;
}

function buildNewsHoursByAssigneeWeek(args: {
  solicitudes: readonly SprintNewsSolicitud[];
  roster: readonly AdoTeamMemberDto[];
  weekKeysByDay: ReadonlyMap<string, string>;
  sprintDayKeys: readonly string[];
}): ReadonlyMap<string, ReadonlyMap<string, number>> {
  const normalized = args.solicitudes.map((solicitud) => ({
    ...solicitud,
    assignee: resolveTimesAssigneeLabel(args.roster, solicitud.assignee),
  }));

  return buildSprintNewsHoursByWeek({
    weekKeysByDay: args.weekKeysByDay,
    sprintDayKeys: args.sprintDayKeys,
    solicitudes: normalized,
  });
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
  const weekKeys = weekGroups.map((days) => {
    const first = days[0];
    if (!first) return "";
    return isoDateOnly(first.value) ?? first.value;
  });
  const weekKeysByDay = new Map<string, string>();
  weekGroups.forEach((days, index) => {
    const weekKey = weekKeys[index] ?? "";
    if (!weekKey) return;
    for (const day of days) {
      weekKeysByDay.set(day.value, weekKey);
    }
  });

  const allSprintDayKeys = workingDays.map((day) => day.value);
  const sprintStartKey = allSprintDayKeys[0] ?? "";

  const weeks = weekGroups
    .map((days, index) =>
      buildWeekColumn(days, `Semana ${index + 1}`),
    )
    .filter((week): week is SprintTimesWeekColumn => week !== null);

  const assigneeRoster = input.assigneeRoster ?? [];
  const assignees = resolveAssigneeLabels(input.tasks, input.bugs, assigneeRoster);

  const newsHoursByAssigneeWeek = buildNewsHoursByAssigneeWeek({
    solicitudes: input.newsSolicitudes ?? [],
    roster: assigneeRoster,
    weekKeysByDay,
    sprintDayKeys: allSprintDayKeys,
  });

  const rows = sortPersonRows(
    assignees.map((assignee) =>
      buildPersonRow({
        assignee,
        tasks: input.tasks,
        bugs: input.bugs,
        roster: assigneeRoster,
        weekDayKeys,
        weekKeys,
        allSprintDayKeys,
        segments: resolveSegmentsForAssignee(
          assignee,
          input.assignmentSegmentsByAssignee,
          sprintStartKey,
        ),
        newsByWeek: newsHoursByAssigneeWeek.get(assignee),
      }),
    ),
  );

  return { weeks, rows };
}
