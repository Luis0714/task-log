"use client";

import { useMemo } from "react";

import { ADO_REQUIRE_PROJECT_TEAM, useAdoQuery } from "@/hooks/use-ado-query";
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

const INITIAL = { members: [] as AdoTeamMemberDto[] };

export function useAdoTeamMembers(
  project: string | undefined,
  team: string | undefined,
  enabled = true,
) {
  const params = useMemo(() => ({ project, team }), [project, team]);
  const { data, loading, error } = useAdoQuery({
    path: "/api/ado/team-members",
    params,
    enabled,
    requireParams: ADO_REQUIRE_PROJECT_TEAM,
    initialData: INITIAL,
    fallbackError: "No se pudieron cargar los miembros del equipo.",
    parse: (payload) => ({
      members: (payload as { members?: AdoTeamMemberDto[] }).members ?? [],
    }),
  });

  return { ...data, loading, error };
}
