import { WORKDAY_MINUTES, workingDurationMs } from "@/lib/review-times/working-duration";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const WORKDAY_MS = WORKDAY_MINUTES * MINUTE_MS;

export function durationBetween(
  startIso: string,
  endIso: string,
  timeZone: string,
): number | null {
  return workingDurationMs(startIso, endIso, timeZone);
}

export function formatReviewDuration(ms: number): string {
  if (ms < MINUTE_MS) return "0 min";
  const totalMinutes = Math.floor(ms / MINUTE_MS);
  if (totalMinutes < 60) return `${totalMinutes} min`;

  if (ms < WORKDAY_MS) {
    const hours = Math.floor(ms / HOUR_MS);
    const minutes = Math.floor((ms % HOUR_MS) / MINUTE_MS);
    return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  }

  const days = Math.floor(ms / WORKDAY_MS);
  const remHours = Math.floor((ms % WORKDAY_MS) / HOUR_MS);
  return remHours > 0 ? `${days} d ${remHours} h` : `${days} d`;
}

export function formatOpenDuration(ms: number): string {
  return `Lleva ${formatReviewDuration(ms)}`;
}
