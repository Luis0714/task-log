"use client";

import { useMemo } from "react";

import { ADO_REQUIRE_PROJECT_TEAM, useAdoQuery } from "@/hooks/use-ado-query";
import { buildNonWorkingDateSet } from "@/lib/dashboard/non-working-days";

const INITIAL = { dates: [] as string[] };

export function useAdoTeamDaysOff(
  project: string | undefined,
  team: string | undefined,
  enabled = true,
) {
  const params = useMemo(() => ({ project, team }), [project, team]);
  const { data, loading, error } = useAdoQuery({
    path: "/api/ado/team-days-off",
    params,
    enabled,
    requireParams: ADO_REQUIRE_PROJECT_TEAM,
    initialData: INITIAL,
    fallbackError: "No se pudieron cargar los días no laborables.",
    parse: (payload) => ({
      dates: (payload as { dates?: string[] }).dates ?? [],
    }),
  });

  const nonWorkingDates = useMemo(
    () => buildNonWorkingDateSet([{ dates: data.dates }]),
    [data.dates],
  );

  return { nonWorkingDates, loading, error };
}
