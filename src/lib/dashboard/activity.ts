import type { CopilotHistoryEntry } from "@/hooks/use-copilot-history";
import { parseLocalDateKey, toLocalDateKey } from "@/lib/dashboard/sprint-days";

export type DashboardActivityItem = {
  id: string;
  type: "time_log" | "state_change";
  at: string;
  description: string;
};

export function parseHoursFromHistorySummary(summary: string): number | null {
  const match = summary.match(/\+(\d+(?:[.,]\d+)?)h/i);
  if (!match?.[1]) return null;
  return Number.parseFloat(match[1].replace(",", "."));
}

function isEntryOnLocalDay(iso: string, dayKey: string): boolean {
  const target = parseLocalDateKey(dayKey);
  if (!target) return false;

  const entryDate = new Date(iso);
  return toLocalDateKey(entryDate) === dayKey;
}

export function computeHoursFromHistoryForDay(
  entries: CopilotHistoryEntry[],
  dayKey: string,
): number {
  return entries.reduce((sum, entry) => {
    if (!entry.ok || !isEntryOnLocalDay(entry.at, dayKey)) return sum;
    const hours = parseHoursFromHistorySummary(entry.summary);
    return hours ? sum + hours : sum;
  }, 0);
}

export function computeHoursFromHistoryThroughDay(
  entries: CopilotHistoryEntry[],
  dayKey: string,
): number {
  return entries.reduce((sum, entry) => {
    if (!entry.ok) return sum;
    const entryDayKey = toLocalDateKey(new Date(entry.at));
    if (entryDayKey > dayKey) return sum;
    const hours = parseHoursFromHistorySummary(entry.summary);
    return hours ? sum + hours : sum;
  }, 0);
}

export function computeHoursFromHistoryForDayKeys(
  entries: CopilotHistoryEntry[],
  dayKeys: string[],
  maxDayKey?: string,
): number {
  if (dayKeys.length === 0) return 0;

  const allowedDays = new Set(dayKeys);

  return entries.reduce((sum, entry) => {
    if (!entry.ok) return sum;
    const entryDayKey = toLocalDateKey(new Date(entry.at));
    if (!allowedDays.has(entryDayKey)) return sum;
    if (maxDayKey && entryDayKey > maxDayKey) return sum;
    const hours = parseHoursFromHistorySummary(entry.summary);
    return hours ? sum + hours : sum;
  }, 0);
}

export function filterHistoryByDay(
  entries: CopilotHistoryEntry[],
  dayKey: string,
): CopilotHistoryEntry[] {
  return entries.filter((entry) => isEntryOnLocalDay(entry.at, dayKey));
}

/** @deprecated Usa computeHoursFromHistoryForDay con el día actual. */
export function computeHoursTodayFromHistory(entries: CopilotHistoryEntry[]): number {
  const todayKey = toLocalDateKey(new Date());
  return computeHoursFromHistoryForDay(entries, todayKey);
}

export function mapHistoryToActivityItems(
  entries: CopilotHistoryEntry[],
  limit = 8,
): DashboardActivityItem[] {
  return entries.slice(0, limit).map((entry) => ({
    id: entry.id,
    type: "time_log",
    at: entry.at,
    description: entry.summary,
  }));
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60_000);

  const formatter = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, "day");
}

export function buildDailySummary(
  inProgress: Array<{ title: string }>,
  history: CopilotHistoryEntry[],
): string {
  if (inProgress.length > 0) {
    const focus = inProgress
      .slice(0, 2)
      .map((item) => item.title)
      .join(" y ");
    return `Avancé en ${focus}.`;
  }

  const recentOk = history.find((entry) => entry.ok);
  if (recentOk) {
    const cleaned = recentOk.summary.replace(/^TaskPilot:\s*/i, "").trim();
    return cleaned.length > 140 ? `${cleaned.slice(0, 137)}…` : cleaned;
  }

  return "Sin actividad registrada recientemente. Registra tiempo para generar tu resumen.";
}
