"use client";

import { useMemo } from "react";

import { ADO_REQUIRE_PROJECT_SPRINT, useAdoQuery } from "@/hooks/use-ado-query";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

const INITIAL = { workItems: [] as AdoWorkItemOptionDto[] };

export function useAdoSprintBugs(
  project: string | undefined,
  sprintPath: string | undefined,
  assignee: string,
  enabled = true,
) {
  const params = useMemo(
    () => ({ project, sprintPath, assignee, kind: "bugs" }),
    [project, sprintPath, assignee],
  );
  const { data, loading, error, refetch } = useAdoQuery({
    path: "/api/ado/work-items",
    params,
    enabled,
    requireParams: ADO_REQUIRE_PROJECT_SPRINT,
    initialData: INITIAL,
    fallbackError: "No se pudieron cargar los bugs del sprint.",
    parse: (payload) => ({
      workItems: (payload as { workItems?: AdoWorkItemOptionDto[] }).workItems ?? [],
    }),
  });

  return { bugs: data.workItems, loading, error, refetch };
}
