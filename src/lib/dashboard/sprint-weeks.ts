import type { CopilotHistoryEntry } from "@/hooks/use-copilot-history";
import { computeHoursFromHistoryForDayKeys } from "@/lib/dashboard/activity";
import { HOURS_PER_SPRINT_WORKING_DAY } from "@/lib/dashboard/sprint-hours";
import type { SprintWorkingDay } from "@/lib/dashboard/sprint-days";
import type { SprintWeekMetrics } from "@/lib/dashboard/types";

export function splitSprintIntoWeeks(
  workingDays: SprintWorkingDay[],
): [SprintWorkingDay[], SprintWorkingDay[]] {
  if (workingDays.length === 0) return [[], []];

  const mid = Math.ceil(workingDays.length / 2);
  return [workingDays.slice(0, mid), workingDays.slice(mid)];
}

export function formatSprintWeekDateRange(days: SprintWorkingDay[]): string {
  if (days.length === 0) return "";

  const formatter = new Intl.DateTimeFormat("es", {
    day: "numeric",
    month: "short",
  });

  const first = formatter.format(days[0].date);
  if (days.length === 1) return first;

  const last = formatter.format(days[days.length - 1].date);
  return `${first} – ${last}`;
}

function roundHours(value: number): number {
  return Math.round(value * 10) / 10;
}

function buildWeekMetrics(
  days: SprintWorkingDay[],
  label: string,
  history: CopilotHistoryEntry[],
  selectedDayKey: string,
): SprintWeekMetrics | null {
  if (days.length === 0) return null;

  const dayKeys = days.map((day) => day.value);
  const hoursCurrent = selectedDayKey
    ? computeHoursFromHistoryForDayKeys(history, dayKeys, selectedDayKey)
    : 0;

  return {
    label,
    hoursCurrent: roundHours(hoursCurrent),
    hoursTarget: days.length * HOURS_PER_SPRINT_WORKING_DAY,
    workingDaysCount: days.length,
    dateRangeLabel: formatSprintWeekDateRange(days),
  };
}

export function computeSprintWeekMetrics(
  workingDays: SprintWorkingDay[],
  history: CopilotHistoryEntry[],
  selectedDayKey: string,
): SprintWeekMetrics[] {
  const [firstWeekDays, secondWeekDays] = splitSprintIntoWeeks(workingDays);

  const weeks = [
    buildWeekMetrics(firstWeekDays, "1ª semana", history, selectedDayKey),
    buildWeekMetrics(secondWeekDays, "2ª semana", history, selectedDayKey),
  ].filter((week): week is SprintWeekMetrics => week !== null);

  return weeks;
}

export function formatWorkingDaysHint(count: number): string {
  if (count <= 0) return "Sin días laborables en el sprint";
  const dayLabel = count === 1 ? "día laborable" : "días laborables";
  const capacity = count * HOURS_PER_SPRINT_WORKING_DAY;
  return `${count} ${dayLabel} · ${capacity}h capacidad`;
}
