"use client";

import { useCallback, useEffect, useState } from "react";

const HISTORY_KEY = "taskpilot_history_v1";
const MAX_ENTRIES = 100;

export type CopilotHistoryEntry = {
  id: string;
  /** Momento en que se ejecutó la acción (ISO). */
  at: string;
  /** Fecha de trabajo registrada en ADO (YYYY-MM-DD), si aplica. */
  workingDate?: string;
  summary: string;
  ok: boolean;
};

export function getHistoryEntryFilterDate(entry: CopilotHistoryEntry): string {
  return entry.workingDate ?? entry.at;
}

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
    const syncHistory = () => {
      setHistory(readHistory());
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncHistory();
      }
    };

    syncHistory();
    window.addEventListener("storage", syncHistory);
    window.addEventListener("focus", syncHistory);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("storage", syncHistory);
      window.removeEventListener("focus", syncHistory);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
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
