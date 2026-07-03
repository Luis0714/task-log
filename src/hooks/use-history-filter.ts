import { useMemo, useState } from "react";

import {
  filterHistoryEntries,
  type CopilotHistoryEntry,
} from "@/lib/history/copilot-history-entry";

export type HistoryFilterRange = 1 | 7 | 15 | 30;

export type HistoryFilterOption = {
  label: string;
  value: HistoryFilterRange;
};

export const HISTORY_FILTER_OPTIONS: HistoryFilterOption[] = [
  { label: "Hoy", value: 1 },
  { label: "7 días", value: 7 },
  { label: "15 días", value: 15 },
  { label: "30 días", value: 30 },
];

const DEFAULT_RANGE: HistoryFilterRange = 15;

export function useHistoryFilter(entries: CopilotHistoryEntry[]) {
  const [range, setRange] = useState<HistoryFilterRange>(DEFAULT_RANGE);

  const filtered = useMemo(
    () => filterHistoryEntries(entries, range),
    [entries, range],
  );

  return { range, setRange, filtered };
}
