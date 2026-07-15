import { roundHours } from "@/lib/number/rounding";

export type HoursBreakdown = {
  taskHours: number;
  bugHours: number;
  newsHours: number;
};

export const EMPTY_HOURS_BREAKDOWN: HoursBreakdown = {
  taskHours: 0,
  bugHours: 0,
  newsHours: 0,
};

export function totalHoursBreakdown(breakdown: HoursBreakdown): number {
  return roundHours(breakdown.taskHours + breakdown.bugHours + breakdown.newsHours);
}

export function sumHoursBreakdowns(
  parts: Iterable<HoursBreakdown>,
): HoursBreakdown {
  let taskHours = 0;
  let bugHours = 0;
  let newsHours = 0;
  for (const part of parts) {
    taskHours += part.taskHours;
    bugHours += part.bugHours;
    newsHours += part.newsHours;
  }
  return {
    taskHours: roundHours(taskHours),
    bugHours: roundHours(bugHours),
    newsHours: roundHours(newsHours),
  };
}
