import "server-only";

import { cache } from "react";

import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { catalogToSprintContext } from "@/lib/ado/sprint-data-context";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { listTasksInSprint, listWorkItemsInSprint } from "@/lib/azure-devops/work-items";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { SprintItemsKind } from "@/lib/sprint-items/types";

export type SprintItemsListSnapshot = {
  items: AdoWorkItemOptionDto[];
  error: string | null;
};

const emptyList: SprintItemsListSnapshot = { items: [], error: null };

export const loadSprintItemsList = cache(async function loadSprintItemsList(
  kind: SprintItemsKind,
  catalog: AdoCatalogSnapshot,
  assignee: string,
): Promise<SprintItemsListSnapshot> {
  const ctx = catalogToSprintContext(catalog, assignee);
  if (!ctx) return emptyList;

  const caller = await requireAdoCaller();
  if (!caller.ok) return emptyList;

  try {
    const scopedAuth = withAdoProject(caller.auth, ctx.project);
    const items =
      kind === "tasks"
        ? await listTasksInSprint(scopedAuth, ctx.sprintPath, { assignee: ctx.assignee })
        : await listWorkItemsInSprint(scopedAuth, ctx.sprintPath, {
            assignee: ctx.assignee,
            workItemType: "Bug",
          });
    return { items, error: null };
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "Error desconocido";
    const label = kind === "tasks" ? "tareas" : "defectos";
    return {
      ...emptyList,
      error: `No se pudieron cargar las ${label} del sprint. — ${detail}`,
    };
  }
});
