import "server-only";

import { cache } from "react";

import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import {
  catalogToSprintContext,
  type SprintDataContext,
} from "@/lib/ado/sprint-data-context";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { enrichItemsWithParentTitles } from "@/lib/azure-devops/work-items";
import {
  listBugsByCreatedDateRange,
  listTasksInWorkingDateRange,
  type WorkingDateRange,
} from "@/lib/azure-devops/work-items-by-date";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import type { AdoWorkItemOption } from "@/lib/azure-devops/work-items";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";
import type { SprintItemsKind } from "@/lib/sprint-items/types";

export type SprintItemsListSnapshot = {
  items: AdoWorkItemOptionDto[];
  error: string | null;
};

const emptyList: SprintItemsListSnapshot = { items: [], error: null };

/**
 * El sprint solo aporta el rango de fechas sobre el que se consultan
 * los work items. NO se aplica como filtro directo (ni por
 * `System.IterationPath`, ni por `System.AreaPath`). El módulo de
 * tareas filtra por fecha de trabajo y el de bugs por fecha de
 * creación, alineado con el Dashboard.
 */
async function listItemsForContext(
  auth: AdoCallerAuth,
  kind: SprintItemsKind,
  ctx: SprintDataContext,
): Promise<AdoWorkItemOption[]> {
  if (!ctx.sprintStartDate || !ctx.sprintFinishDate) return [];

  const range: WorkingDateRange = {
    startDate: ctx.sprintStartDate,
    finishDate: ctx.sprintFinishDate,
  };
  const filters = { assignee: ctx.assignee, team: ctx.team };
  return kind === "tasks"
    ? listTasksInWorkingDateRange(auth, range, filters)
    : listBugsByCreatedDateRange(auth, range, filters);
}

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
    const rawItems = await listItemsForContext(scopedAuth, kind, ctx);
    const items = await enrichItemsWithParentTitles(scopedAuth, rawItems);
    return { items, error: null };
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "Error desconocido";
    const label = kind === "tasks" ? "tareas" : "Bugs";
    return {
      ...emptyList,
      error: `No se pudieron cargar las ${label} del sprint. — ${detail}`,
    };
  }
});
