"use client";

import { useMemo } from "react";

import { ADO_REQUIRE_PROJECT, useAdoQuery } from "@/hooks/use-ado-query";
import type { AdoTeamDto } from "@/lib/schemas/ado-catalog";

const INITIAL = {
  teams: [] as AdoTeamDto[],
  defaultTeam: null as string | null,
  suggestedTeam: null as string | null,
};

export function useAdoTeams(project: string | undefined, enabled = true) {
  const params = useMemo(() => ({ project }), [project]);
  const { data, loading, error } = useAdoQuery({
    path: "/api/ado/teams",
    params,
    enabled,
    requireParams: ADO_REQUIRE_PROJECT,
    initialData: INITIAL,
    fallbackError: "No se pudieron cargar los equipos.",
    parse: (payload) => ({
      teams: (payload as { teams?: AdoTeamDto[] }).teams ?? [],
      defaultTeam: (payload as { defaultTeam?: string }).defaultTeam?.trim() || null,
      suggestedTeam: (payload as { suggestedTeam?: string }).suggestedTeam?.trim() || null,
    }),
  });

  return { ...data, loading, error };
}
