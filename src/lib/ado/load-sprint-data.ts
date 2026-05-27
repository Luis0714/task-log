import "server-only";

import { cache } from "react";

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
  project: string,
  sprintPath: string,
  assignee: string,
): Promise<SprintDataPart<AdoWorkItemOptionDto[]>> {
  try {
    const auth = await resolveScopedAuth(project);
    if (!auth) {
      return { data: [], error: "Conecta Azure DevOps para cargar historias del sprint." };
    }
    const data = await listWorkItemsInSprint(auth, sprintPath, { assignee });
    return { data, error: null };
  } catch (cause) {
    return { data: [], error: formatSprintDataError(cause) };
  }
});

export const loadSprintBugs = cache(async function loadSprintBugs(
  project: string,
  sprintPath: string,
  assignee: string,
): Promise<SprintDataPart<AdoWorkItemOptionDto[]>> {
  try {
    const auth = await resolveScopedAuth(project);
    if (!auth) {
      return { data: [], error: "Conecta Azure DevOps para cargar Bugs del sprint." };
    }
    const data = await listWorkItemsInSprint(auth, sprintPath, {
      assignee,
      workItemType: "Bug",
    });
    return { data, error: null };
  } catch (cause) {
    return { data: [], error: formatSprintDataError(cause) };
  }
});

export const loadSprintTasks = cache(async function loadSprintTasks(
  project: string,
  sprintPath: string,
  assignee: string,
): Promise<SprintDataPart<AdoWorkItemOptionDto[]>> {
  try {
    const auth = await resolveScopedAuth(project);
    if (!auth) {
      return { data: [], error: "Conecta Azure DevOps para cargar tareas del sprint." };
    }
    const data = await listTasksInSprint(auth, sprintPath, { assignee });
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
  project: string,
  team: string,
): Promise<SprintDataPart<string[]>> {
  try {
    const data = await loadNonWorkingDates(project, team);
    return { data, error: null };
  } catch (cause) {
    return { data: [], error: formatSprintDataError(cause) };
  }
});
