import {
  EMPTY_HOURS_BREAKDOWN,
  type HoursBreakdown,
} from "@/lib/hours/hours-breakdown";

export function sumWeekBreakdowns(
  rows: readonly { weeks: readonly (HoursBreakdown | undefined)[] }[],
  weekIndex: number,
): HoursBreakdown {
  return rows.reduce<HoursBreakdown>(
    (acc, row) => {
      const w = row.weeks[weekIndex] ?? EMPTY_HOURS_BREAKDOWN;
      return {
        taskHours: acc.taskHours + w.taskHours,
        bugHours: acc.bugHours + w.bugHours,
        newsHours: acc.newsHours + w.newsHours,
      };
    },
    { ...EMPTY_HOURS_BREAKDOWN },
  );
}

export function sumSprintBreakdowns(
  rows: readonly { sprint: HoursBreakdown }[],
): HoursBreakdown {
  return rows.reduce<HoursBreakdown>(
    (acc, row) => ({
      taskHours: acc.taskHours + row.sprint.taskHours,
      bugHours: acc.bugHours + row.sprint.bugHours,
      newsHours: acc.newsHours + row.sprint.newsHours,
    }),
    { ...EMPTY_HOURS_BREAKDOWN },
  );
}
