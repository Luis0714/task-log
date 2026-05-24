"use client";

import { useEffect, useState } from "react";

import type { AdoSprintDto } from "@/lib/schemas/ado-catalog";

type UseAdoSprintsResult = {
  sprints: AdoSprintDto[];
  loading: boolean;
  error: string | null;
};

export function useAdoSprints(enabled = true): UseAdoSprintsResult {
  const [sprints, setSprints] = useState<AdoSprintDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setSprints([]);
      setError(null);
      return;
    }

    const controller = new AbortController();

    async function loadSprints() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/ado/sprints", { signal: controller.signal });
        const data = (await res.json()) as {
          sprints?: AdoSprintDto[];
          error?: string;
          detail?: string;
        };

        if (!res.ok) {
          setSprints([]);
          setError([data.error, data.detail].filter(Boolean).join(" — ") || "Error al cargar sprints.");
          return;
        }

        setSprints(data.sprints ?? []);
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setSprints([]);
        setError("No se pudieron cargar los sprints.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadSprints();
    return () => controller.abort();
  }, [enabled]);

  return { sprints, loading, error };
}
