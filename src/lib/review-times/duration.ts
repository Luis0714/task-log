const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function durationBetween(startIso: string, endIso: string): number | null {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  return Math.max(0, end - start);
}

export function formatReviewDuration(ms: number): string {
  if (ms < MINUTE_MS) return "0 min";
  const totalMinutes = Math.floor(ms / MINUTE_MS);
  if (totalMinutes < 60) return `${totalMinutes} min`;

  const hours = Math.floor(ms / HOUR_MS);
  if (hours < 24) {
    const minutes = Math.floor((ms % HOUR_MS) / MINUTE_MS);
    return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
  }

  const days = Math.floor(ms / DAY_MS);
  const remHours = Math.floor((ms % DAY_MS) / HOUR_MS);
  return remHours > 0 ? `${days} d ${remHours} h` : `${days} d`;
}

export function formatOpenDuration(ms: number): string {
  return `Lleva ${formatReviewDuration(ms)}`;
}
