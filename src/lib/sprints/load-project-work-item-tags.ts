import "server-only";

import { cache } from "react";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { listProjectWorkItemTags } from "@/lib/azure-devops/tags";
import type { AdoWorkItemTagDto } from "@/lib/schemas/ado-catalog";

export type ProjectWorkItemTagsSnapshot = {
  tags: AdoWorkItemTagDto[];
  error: string | null;
};

export const loadProjectWorkItemTags = cache(async function loadProjectWorkItemTags(
  project: string,
): Promise<ProjectWorkItemTagsSnapshot> {
  const trimmedProject = project.trim();
  if (!trimmedProject) {
    return { tags: [], error: null };
  }

  const auth = await getScopedProjectAuth(trimmedProject);
  if (!auth) {
    return { tags: [], error: null };
  }

  try {
    const tags = await listProjectWorkItemTags(auth);
    return { tags, error: null };
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "Error desconocido";
    return {
      tags: [],
      error: `No se pudieron cargar los tags del proyecto. — ${detail}`,
    };
  }
});
