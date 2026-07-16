import { roundToDecimals } from "@/lib/number/rounding";

export type SprintNewsSolicitud = Readonly<{
  /** Display name del assignee en ADO / roster. */
  assignee: string;
  /** YYYY-MM-DD (inclusive). */
  fechaInicio: string;
  /** YYYY-MM-DD (inclusive). */
  fechaFin: string;
  /** Horas acumuladas Completed Work. */
  hours: number;
}>;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function compareIso(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export type BuildSprintNewsHoursByWeekInput = {
  weekKeysByDay: ReadonlyMap<string, string>;
  sprintDayKeys: readonly string[];
  solicitudes: readonly SprintNewsSolicitud[];
};

export type SprintWeekKey = string;

export function buildSprintNewsHoursByWeek(
  input: BuildSprintNewsHoursByWeekInput,
): ReadonlyMap<string, ReadonlyMap<SprintWeekKey, number>> {
  const result = new Map<string, Map<SprintWeekKey, number>>();
  if (input.solicitudes.length === 0 || input.sprintDayKeys.length === 0) {
    return result;
  }

  const sprintStart = input.sprintDayKeys[0];
  const sprintEnd = input.sprintDayKeys[input.sprintDayKeys.length - 1];
  if (!sprintStart || !sprintEnd) {
    return result;
  }

  const sprintDaySet = new Set(input.sprintDayKeys);

  for (const solicitud of input.solicitudes) {
    if (!ISO_DATE_PATTERN.test(solicitud.fechaInicio)) continue;
    if (!ISO_DATE_PATTERN.test(solicitud.fechaFin)) continue;
    if (solicitud.hours <= 0) continue;

    const overlapStart =
      compareIso(solicitud.fechaInicio, sprintStart) > 0
        ? solicitud.fechaInicio
        : sprintStart;
    const overlapEnd =
      compareIso(solicitud.fechaFin, sprintEnd) < 0
        ? solicitud.fechaFin
        : sprintEnd;
    if (compareIso(overlapStart, overlapEnd) > 0) continue;

    const overlapDays: string[] = [];
    for (const day of input.sprintDayKeys) {
      if (compareIso(day, overlapStart) < 0) continue;
      if (compareIso(day, overlapEnd) > 0) break;
      if (sprintDaySet.has(day)) overlapDays.push(day);
    }
    if (overlapDays.length === 0) continue;

    const perDay = roundToDecimals(solicitud.hours / overlapDays.length, 2);
    const assigneeMap = result.get(solicitud.assignee) ?? new Map();
    let remainder = solicitud.hours - perDay * overlapDays.length;
    let i = 0;
    for (const day of overlapDays) {
      const weekKey = input.weekKeysByDay.get(day);
      if (!weekKey) continue;
      const share = i === overlapDays.length - 1 ? perDay + remainder : perDay;
      remainder = 0;
      assigneeMap.set(weekKey, (assigneeMap.get(weekKey) ?? 0) + share);
      i += 1;
    }
    result.set(solicitud.assignee, assigneeMap);
  }

  return result;
}
