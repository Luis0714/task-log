"use client";

import { useEffect, useState } from "react";

import {
  AUTH_REHYDRATION_EVENT,
  clearAuthRehydratingFlag,
  readAuthRehydratingFlag,
} from "@/lib/auth/auth-rehydration";

const REHYDRATION_TIMEOUT_MS = 15_000;

function readInitialRehydrating(): boolean {
  if (typeof window === "undefined") return false;
  return readAuthRehydratingFlag();
}

/** True mientras el dashboard espera datos reales tras login/registro. */
export function useAuthRehydration(showLiveData: boolean): boolean {
  const [rehydrating, setRehydrating] = useState(readInitialRehydrating);

  useEffect(() => {
    const handleStart = () => setRehydrating(true);
    window.addEventListener(AUTH_REHYDRATION_EVENT, handleStart);
    return () => window.removeEventListener(AUTH_REHYDRATION_EVENT, handleStart);
  }, []);

  useEffect(() => {
    if (!rehydrating) return;

    if (showLiveData) {
      clearAuthRehydratingFlag();
      setRehydrating(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      clearAuthRehydratingFlag();
      setRehydrating(false);
    }, REHYDRATION_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [rehydrating, showLiveData]);

  return rehydrating;
}
