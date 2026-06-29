"use client";

import { useCallback, useEffect, useState } from "react";

import { DEFAULT_PROVIDER_ID, PROVIDER_CONFIGS } from "@/lib/agent/providers/config";
import type { ProviderId } from "@/lib/agent/providers/types";

const STORAGE_KEY = "neos-ia:provider";

export function useProviderPreference() {
  const [providerId, setProviderId] = useState<ProviderId>(DEFAULT_PROVIDER_ID);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ProviderId | null;
      if (stored && stored in PROVIDER_CONFIGS) setProviderId(stored);
    } catch {
      // localStorage unavailable (SSR, private browsing)
    }
    setHydrated(true);
  }, []);

  const changeProvider = useCallback((id: ProviderId) => {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
    setProviderId(id);
  }, []);

  return { providerId, changeProvider, hydrated };
}
