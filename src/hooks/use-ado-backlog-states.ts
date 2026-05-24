"use client";

import { useMemo } from "react";

import { ADO_REQUIRE_PROJECT, useAdoQuery } from "@/hooks/use-ado-query";
import type { AdoTaskStateDto } from "@/lib/schemas/ado-catalog";

const INITIAL = { states: [] as AdoTaskStateDto[] };

export function useAdoBacklogStates(project: string | undefined, enabled = true) {
  const params = useMemo(() => ({ project }), [project]);
  const { data, loading, error } = useAdoQuery({
    path: "/api/ado/backlog-states",
    params,
    enabled,
    requireParams: ADO_REQUIRE_PROJECT,
    initialData: INITIAL,
    fallbackError: "No se pudieron cargar los estados del backlog.",
    parse: (payload) => ({
      states: (payload as { states?: AdoTaskStateDto[] }).states ?? [],
    }),
  });

  return { ...data, loading, error };
}
