"use client";

import { useMemo } from "react";

import { ADO_REQUIRE_PROJECT, useAdoQuery } from "@/hooks/use-ado-query";
import type { AdoTaskStateDto } from "@/lib/schemas/ado-catalog";

const INITIAL = {
  states: [] as AdoTaskStateDto[],
  defaultOpenState: null as string | null,
  defaultCompletedState: null as string | null,
};

export function useAdoTaskStates(project: string | undefined, enabled = true) {
  const params = useMemo(() => ({ project }), [project]);
  const { data, loading, error } = useAdoQuery({
    path: "/api/ado/task-states",
    params,
    enabled,
    requireParams: ADO_REQUIRE_PROJECT,
    initialData: INITIAL,
    fallbackError: "No se pudieron cargar los estados de Task.",
    parse: (payload) => ({
      states: (payload as { states?: AdoTaskStateDto[] }).states ?? [],
      defaultOpenState: (payload as { defaultOpenState?: string }).defaultOpenState?.trim() || null,
      defaultCompletedState:
        (payload as { defaultCompletedState?: string }).defaultCompletedState?.trim() || null,
    }),
  });

  return { ...data, loading, error };
}
