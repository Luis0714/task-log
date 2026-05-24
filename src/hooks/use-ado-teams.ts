"use client";

import { useEffect, useState } from "react";

import type { AdoTeamDto } from "@/lib/schemas/ado-catalog";

type UseAdoTeamsResult = {
  teams: AdoTeamDto[];
  defaultTeam: string | null;
  suggestedTeam: string | null;
  loading: boolean;
  error: string | null;
};

export function useAdoTeams(
  project: string | undefined,
  enabled = true,
): UseAdoTeamsResult {
  const [teams, setTeams] = useState<AdoTeamDto[]>([]);
  const [defaultTeam, setDefaultTeam] = useState<string | null>(null);
  const [suggestedTeam, setSuggestedTeam] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !project) {
      setTeams([]);
      setDefaultTeam(null);
      setSuggestedTeam(null);
      setError(null);
      setLoading(false);
      return;
    }

    const activeProject = project;
    const controller = new AbortController();

    async function loadTeams() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ project: activeProject });
        const res = await fetch(`/api/ado/teams?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as {
          teams?: AdoTeamDto[];
          defaultTeam?: string;
          suggestedTeam?: string;
          error?: string;
          detail?: string;
        };

        if (!res.ok) {
          setTeams([]);
          setDefaultTeam(null);
          setSuggestedTeam(null);
          setError([data.error, data.detail].filter(Boolean).join(" — ") || "Error al cargar equipos.");
          return;
        }

        setTeams(data.teams ?? []);
        setDefaultTeam(data.defaultTeam?.trim() || null);
        setSuggestedTeam(data.suggestedTeam?.trim() || null);
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setTeams([]);
        setDefaultTeam(null);
        setSuggestedTeam(null);
        setError("No se pudieron cargar los equipos.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadTeams();
    return () => controller.abort();
  }, [enabled, project]);

  return { teams, defaultTeam, suggestedTeam, loading, error };
}
