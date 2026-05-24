"use client";

import { useEffect, useState } from "react";

import type { AdoSprintDto } from "@/lib/schemas/ado-catalog";

type UseAdoSprintsResult = {
  sprints: AdoSprintDto[];
  loading: boolean;
  error: string | null;
};

export function useAdoSprints(
  project: string | undefined,
  team: string | undefined,
  enabled = true,
): UseAdoSprintsResult {
  const [sprints, setSprints] = useState<AdoSprintDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !project || !team) {
      setSprints([]);
      setError(null);
      setLoading(false);
      return;
    }

    const activeProject = project;
    const activeTeam = team;
    const controller = new AbortController();

    async function loadSprints() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ project: activeProject, team: activeTeam });
        const res = await fetch(`/api/ado/sprints?${params.toString()}`, {
          signal: controller.signal,
        });
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
  }, [enabled, project, team]);

  return { sprints, loading, error };
}
