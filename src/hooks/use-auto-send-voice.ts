"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "neos-ia.voice.autoSend";

/**
 * Persisted user preference: when the user finishes dictating (clicks stop,
 * or the speech session ends), should Neos IA send the transcript for
 * interpretation automatically, or wait for the user to click Interpretar?
 *
 * Default: OFF (review-before-send). The user can flip it on in the footer.
 */
export function useAutoSendVoicePreference(): {
  autoSend: boolean;
  setAutoSend: (value: boolean) => void;
} {
  // SSR-safe: lazy initializer returns false on the server, then a useEffect
  // hydrates from localStorage after mount to avoid hydration mismatch.
  const [autoSend, setAutoSend] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "1") setAutoSend(true);
    } catch {
      // localStorage unavailable (private mode, etc.) — keep default false.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, autoSend ? "1" : "0");
    } catch {
      // Same as above — silently degrade.
    }
  }, [autoSend, hydrated]);

  return { autoSend, setAutoSend };
}
