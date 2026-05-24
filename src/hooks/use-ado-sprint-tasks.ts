"use client";

import { useMemo } from "react";

import { ADO_REQUIRE_PROJECT_SPRINT, useAdoQuery } from "@/hooks/use-ado-query";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

const INITIAL = { workItems: [] as AdoWorkItemOptionDto[] };

export function useAdoSprintTasks(
  project: string | undefined,
  sprintPath: string | undefined,
  assignee: string,
  enabled = true,
) {
  const params = useMemo(
    () => ({ project, sprintPath, assignee, kind: "tasks" }),
    [project, sprintPath, assignee],
  );

  const { data, loading, error } = useAdoQuery({
    path: "/api/ado/work-items",
    params,
    enabled,
    requireParams: ADO_REQUIRE_PROJECT_SPRINT,
    initialData: INITIAL,
    fallbackError: "No se pudieron cargar las tasks del sprint.",
    parse: (payload) => ({
      workItems: (payload as { workItems?: AdoWorkItemOptionDto[] }).workItems ?? [],
    }),
  });

  return { tasks: data.workItems, loading, error };
}
