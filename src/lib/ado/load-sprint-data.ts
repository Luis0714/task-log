import "server-only";

import { cache } from "react";

import type { SprintDataContext } from "@/lib/ado/sprint-data-context";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { listBacklogItemStates } from "@/lib/azure-devops/work-item-type-states";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { loadNonWorkingDates } from "@/lib/ado/load-non-working-dates";
import { listTasksInSprint, listWorkItemsInSprint } from "@/lib/azure-devops/work-items";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import type {
  AdoTaskStateDto,
  AdoWorkItemOptionDto,
} from "@/lib/schemas/ado-catalog";

export type SprintDataPart<T> = {
  data: T;
  error: string | null;
};

function formatSprintDataError(cause: unknown): string {
  const detail = cause instanceof Error ? cause.message : "Error desconocido";
  return `No se pudieron cargar los datos del sprint. — ${detail}`;
}

async function resolveScopedAuth(project: string): Promise<AdoCallerAuth | null> {
  const caller = await requireAdoCaller();
  if (!caller.ok) return null;
  return withAdoProject(caller.auth, project);
}

export function firstSprintDataError(
  ...parts: readonly SprintDataPart<unknown>[]
): string | null {
  return parts.find((part) => part.error)?.error ?? null;
}

export const loadSprintWorkItems = cache(async function loadSprintWorkItems(
  ctx: SprintDataContext,
): Promise<SprintDataPart<AdoWorkItemOptionDto[]>> {
  try {
    const auth = await resolveScopedAuth(ctx.project);
    if (!auth) {
      return { data: [], error: "Conecta Azure DevOps para cargar historias del sprint." };
    }
    const data = await listWorkItemsInSprint(auth, ctx.sprintPath, {
      assignee: ctx.assignee,
    });
    return { data, error: null };
  } catch (cause) {
    return { data: [], error: formatSprintDataError(cause) };
  }
});

export const loadSprintBugs = cache(async function loadSprintBugs(
  ctx: SprintDataContext,
): Promise<SprintDataPart<AdoWorkItemOptionDto[]>> {
  try {
    const auth = await resolveScopedAuth(ctx.project);
    if (!auth) {
      return { data: [], error: "Conecta Azure DevOps para cargar bugs del sprint." };
    }
    const data = await listWorkItemsInSprint(auth, ctx.sprintPath, {
      assignee: ctx.assignee,
      workItemType: "Bug",
    });
    return { data, error: null };
  } catch (cause) {
    return { data: [], error: formatSprintDataError(cause) };
  }
});

export const loadSprintTasks = cache(async function loadSprintTasks(
  ctx: SprintDataContext,
): Promise<SprintDataPart<AdoWorkItemOptionDto[]>> {
  try {
    const auth = await resolveScopedAuth(ctx.project);
    if (!auth) {
      return { data: [], error: "Conecta Azure DevOps para cargar tasks del sprint." };
    }
    const data = await listTasksInSprint(auth, ctx.sprintPath, { assignee: ctx.assignee });
    return { data, error: null };
  } catch (cause) {
    return { data: [], error: formatSprintDataError(cause) };
  }
});

export const loadSprintBacklogStates = cache(async function loadSprintBacklogStates(
  project: string,
): Promise<SprintDataPart<AdoTaskStateDto[]>> {
  try {
    const auth = await resolveScopedAuth(project);
    if (!auth) {
      return { data: [], error: "Conecta Azure DevOps para cargar estados del backlog." };
    }
    const data = await listBacklogItemStates(auth);
    return { data, error: null };
  } catch (cause) {
    return { data: [], error: formatSprintDataError(cause) };
  }
});

export const loadSprintNonWorkingDates = cache(async function loadSprintNonWorkingDates(
  ctx: SprintDataContext,
): Promise<SprintDataPart<string[]>> {
  try {
    const data = await loadNonWorkingDates(ctx.project, ctx.team);
    return { data, error: null };
  } catch (cause) {
    return { data: [], error: formatSprintDataError(cause) };
  }
});
