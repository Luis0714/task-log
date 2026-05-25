import type { SprintDayHoursPoint } from "@/lib/dashboard/sprint-hours-series";

export type HoursPaceStatus = "ahead" | "on_track" | "behind";

export function getHoursPaceStatus(
  points: readonly SprintDayHoursPoint[],
): HoursPaceStatus | null {
  const last = points[points.length - 1];
  if (!last) return null;

  const delta = last.cumulativeHours - last.idealCumulativeHours;
  if (delta >= 2) return "ahead";
  if (delta <= -4) return "behind";
  return "on_track";
}
