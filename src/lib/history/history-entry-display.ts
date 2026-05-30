import type { CopilotHistoryEntry } from "@/lib/history/copilot-history-entry";
import {
  formatDateKey,
  formatDateTime,
  isSameCalendarDay,
} from "@/lib/date/date-range";

export type HistoryEntryDisplay = {
  workingDateTime: string | null;
  workingDateLabel: string | null;
  executedDateTime: string | null;
  executedAtLabel: string | null;
};

export function getHistoryEntryDisplay(entry: CopilotHistoryEntry): HistoryEntryDisplay {
  if (!entry.workingDate) {
    return {
      workingDateTime: null,
      workingDateLabel: null,
      executedDateTime: entry.at,
      executedAtLabel: formatDateTime(entry.at),
    };
  }

  const showExecutedAt = !isSameCalendarDay(entry.workingDate, entry.at);

  return {
    workingDateTime: entry.workingDate,
    workingDateLabel: formatDateKey(entry.workingDate),
    executedDateTime: showExecutedAt ? entry.at : null,
    executedAtLabel: showExecutedAt ? formatDateTime(entry.at) : null,
  };
}
