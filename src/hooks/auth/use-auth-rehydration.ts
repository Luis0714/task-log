"use client";

import { useEffect, useState } from "react";

import {
  AUTH_REHYDRATION_EVENT,
  clearAuthRehydratingFlag,
  readAuthRehydratingFlag,
} from "@/lib/auth/auth-rehydration";

const REHYDRATION_TIMEOUT_MS = 15_000;

/** True mientras el dashboard espera datos reales tras login/registro. */
export function useAuthRehydration(showLiveData: boolean): boolean {
  const [rehydrating, setRehydrating] = useState(false);

  useEffect(() => {
    const handleStart = () => setRehydrating(true);
    globalThis.addEventListener(AUTH_REHYDRATION_EVENT, handleStart);

    if (readAuthRehydratingFlag()) {
      queueMicrotask(() => {
        globalThis.dispatchEvent(new Event(AUTH_REHYDRATION_EVENT));
      });
    }

    return () => {
      globalThis.removeEventListener(AUTH_REHYDRATION_EVENT, handleStart);
    };
  }, []);

  useEffect(() => {
    if (!rehydrating) return;

    if (showLiveData) {
      clearAuthRehydratingFlag();
      queueMicrotask(() => setRehydrating(false));
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      clearAuthRehydratingFlag();
      setRehydrating(false);
    }, REHYDRATION_TIMEOUT_MS);

    return () => globalThis.clearTimeout(timeoutId);
  }, [rehydrating, showLiveData]);

  return rehydrating;
}
