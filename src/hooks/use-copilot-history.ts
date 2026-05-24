"use client";

import { useCallback, useEffect, useState } from "react";

const HISTORY_KEY = "taskpilot_history_v1";
const MAX_ENTRIES = 30;

export type CopilotHistoryEntry = {
  id: string;
  at: string;
  summary: string;
  ok: boolean;
};

function readHistory(): CopilotHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as CopilotHistoryEntry[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: CopilotHistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function useCopilotHistory() {
  const [history, setHistory] = useState<CopilotHistoryEntry[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- estado en localStorage
    setHistory(readHistory());
  }, []);

  const appendEntry = useCallback((entry: CopilotHistoryEntry) => {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, MAX_ENTRIES);
      writeHistory(next);
      return next;
    });
  }, []);

  return { history, appendEntry };
}
