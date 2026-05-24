"use client";

import { useMemo } from "react";

import { useAdoQuery } from "@/hooks/use-ado-query";
import type { AdoProjectDto } from "@/lib/schemas/ado-catalog";

const INITIAL = { projects: [] as AdoProjectDto[], defaultProject: null as string | null };

export function useAdoProjects(enabled = true) {
  const params = useMemo(() => ({}), []);
  const { data, loading, error } = useAdoQuery({
    path: "/api/ado/projects",
    params,
    enabled,
    initialData: INITIAL,
    fallbackError: "No se pudieron cargar los proyectos.",
    parse: (payload) => ({
      projects: (payload as { projects?: AdoProjectDto[] }).projects ?? [],
      defaultProject:
        (payload as { defaultProject?: string }).defaultProject?.trim() || null,
    }),
  });

  return { ...data, loading, error };
}
