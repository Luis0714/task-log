"use client";

import { useMemo } from "react";

import { useAdoQuery } from "@/hooks/use-ado-query";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

const INITIAL = { workItems: [] as AdoWorkItemOptionDto[] };

export function useAdoSprintWorkItems(
  project: string | undefined,
  sprintPath: string | undefined,
  assignee: string,
  enabled = true,
) {
  const params = useMemo(
    () => ({ project, sprintPath, assignee }),
    [project, sprintPath, assignee],
  );
  const { data, loading, error } = useAdoQuery({
    path: "/api/ado/work-items",
    params,
    enabled,
    requireParams: ["project", "sprintPath"],
    initialData: INITIAL,
    fallbackError: "No se pudieron cargar los work items.",
    parse: (payload) => ({
      workItems: (payload as { workItems?: AdoWorkItemOptionDto[] }).workItems ?? [],
    }),
  });

  return { ...data, loading, error };
}
