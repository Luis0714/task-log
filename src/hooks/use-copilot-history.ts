"use client";

import { useCallback, useEffect, useState } from "react";

import { useHistoryScopeKey } from "@/components/history/history-scope-provider";
import type { CopilotHistoryEntry } from "@/lib/history/copilot-history-entry";
import {
  MAX_HISTORY_ENTRIES,
  readScopedHistory,
  writeScopedHistory,
} from "@/lib/history/history-storage";

export type { CopilotHistoryEntry } from "@/lib/history/copilot-history-entry";
export {
  filterHistoryEntries,
  isHistoryEntryWithinRange,
} from "@/lib/history/copilot-history-entry";

export function useCopilotHistory() {
  const scopeKey = useHistoryScopeKey();
  const [history, setHistory] = useState<CopilotHistoryEntry[]>([]);

  useEffect(() => {
    if (!scopeKey) {
      setHistory([]);
      return;
    }

    const syncHistory = () => {
      setHistory(readScopedHistory(scopeKey));
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
  }, [scopeKey]);

  const appendEntry = useCallback(
    (entry: CopilotHistoryEntry) => {
      if (!scopeKey) return;

      setHistory((prev) => {
        const next = [entry, ...prev].slice(0, MAX_HISTORY_ENTRIES);
        writeScopedHistory(scopeKey, next);
        return next;
      });
    },
    [scopeKey],
  );

  return { history, appendEntry };
}
