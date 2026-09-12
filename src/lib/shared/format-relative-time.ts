const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const relativeFormatter = new Intl.RelativeTimeFormat("es", { numeric: "always" });

export function formatRelativeTime(isoDate: string, now = new Date()): string {
  const then = new Date(isoDate);
  const diffMs = then.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);

  if (absMs < MINUTE_MS) return "ahora";
  if (absMs < HOUR_MS) {
    return relativeFormatter.format(Math.round(diffMs / MINUTE_MS), "minute");
  }
  if (absMs < DAY_MS) {
    return relativeFormatter.format(Math.round(diffMs / HOUR_MS), "hour");
  }
  return relativeFormatter.format(Math.round(diffMs / DAY_MS), "day");
}
