"use client";

import { useMemo } from "react";

import { ADO_REQUIRE_PROJECT_TEAM, useAdoQuery } from "@/hooks/use-ado-query";
import type { AdoSprintDto } from "@/lib/schemas/ado-catalog";

const INITIAL = { sprints: [] as AdoSprintDto[] };

export function useAdoSprints(
  project: string | undefined,
  team: string | undefined,
  enabled = true,
) {
  const params = useMemo(() => ({ project, team }), [project, team]);
  const { data, loading, error } = useAdoQuery({
    path: "/api/ado/sprints",
    params,
    enabled,
    requireParams: ADO_REQUIRE_PROJECT_TEAM,
    initialData: INITIAL,
    fallbackError: "No se pudieron cargar los sprints.",
    parse: (payload) => ({
      sprints: (payload as { sprints?: AdoSprintDto[] }).sprints ?? [],
    }),
  });

  return { ...data, loading, error };
}
