import { isWithinDays } from "@/lib/date/date-range";
import { parseLocalDateKey } from "@/lib/dashboard/sprint-days";

export type CopilotHistoryEntry = {
  id: string;
  /** Momento en que se ejecutó la acción (ISO). */
  at: string;
  /** Fecha de trabajo registrada en ADO (YYYY-MM-DD), si aplica. */
  workingDate?: string;
  summary: string;
  ok: boolean;
};

/** Fecha principal usada para ordenar (día de trabajo si existe). */
export function getHistoryEntrySortTimestamp(entry: CopilotHistoryEntry): number {
  if (entry.workingDate) {
    const workingDay = parseLocalDateKey(entry.workingDate);
    if (workingDay) return workingDay.getTime();
  }

  const executedAt = new Date(entry.at);
  return Number.isNaN(executedAt.getTime()) ? 0 : executedAt.getTime();
}

/**
 * Incluye la entrada si su día de trabajo o su fecha de registro cae en el rango.
 * Así no se pierden registros recientes ni trabajo dentro de la ventana del chip.
 */
export function isHistoryEntryWithinRange(
  entry: CopilotHistoryEntry,
  days: number,
): boolean {
  const dates = entry.workingDate ? [entry.workingDate, entry.at] : [entry.at];
  return dates.some((date) => isWithinDays(date, days));
}

export function filterHistoryEntries(
  entries: CopilotHistoryEntry[],
  days: number,
): CopilotHistoryEntry[] {
  return entries
    .filter((entry) => isHistoryEntryWithinRange(entry, days))
    .sort((a, b) => {
      const byDay = getHistoryEntrySortTimestamp(b) - getHistoryEntrySortTimestamp(a);
      if (byDay !== 0) return byDay;
      return new Date(b.at).getTime() - new Date(a.at).getTime();
    });
}
