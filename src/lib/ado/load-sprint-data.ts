import "server-only";

import { cache } from "react";

import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { listBacklogItemStates, listBugStates } from "@/lib/azure-devops/work-item-type-states";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { loadHolidayDateKeysInRange } from "@/lib/hours/load-working-day-keys";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import {
  listBugItemsInSprint,
  listTasksInSprint,
  listWorkItemsInSprint,
} from "@/lib/azure-devops/work-items";
import {
  listBugsInWorkingDateRange,
  listParentStoriesForTasks,
  listTasksInWorkingDateRange,
  type WorkingDateRange,
} from "@/lib/azure-devops/work-items-by-date";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import type {
  AdoTaskStateDto,
  AdoWorkItemOptionDto,
} from "@/lib/schemas/ado-catalog";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { logApiError } from "@/lib/errors/log-api-error";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { RESPONSABLE_ENV_KEYS } from "@/lib/azure-devops/backlog-item-fields-config";

async function resolvePbiAssigneeField(): Promise<string | undefined> {
  if (!isIronSessionConfigured()) return undefined;
  const session = await getTaskPilotSession();
  if (session.userRole?.trim().toLowerCase() !== "qa") return undefined;
  const qaField = process.env[RESPONSABLE_ENV_KEYS.qa]?.trim();
  return qaField || undefined;
}

export type SprintDataPart<T> = {
  data: T;
  error: string | null;
};

function formatSprintDataError(cause: unknown): string {
  logApiError("loadSprintData", cause);
  return USER_MESSAGES.sprintLoadFailed;
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
    const [auth, pbiAssigneeField] = await Promise.all([
      resolveScopedAuth(project),
      resolvePbiAssigneeField(),
    ]);
    if (!auth) {
      return { data: [], error: "Conecta Azure DevOps para cargar historias del sprint." };
    }
    const data = await listWorkItemsInSprint(auth, sprintPath, {
      assignee,
      pbiAssigneeField,
    });
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
    const data = await listBugItemsInSprint(auth, sprintPath, { assignee });
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

type ListInWorkingDateRange = typeof listTasksInWorkingDateRange;

async function loadWorkItemsInPeriod(
  project: string,
  team: string,
  range: WorkingDateRange,
  assignee: string,
  listInRange: ListInWorkingDateRange,
  connectMessage: string,
): Promise<SprintDataPart<AdoWorkItemOptionDto[]>> {
  try {
    const auth = await resolveScopedAuth(project);
    if (!auth) {
      return { data: [], error: connectMessage };
    }
    const data = await listInRange(auth, range, { assignee, team });
    return { data, error: null };
  } catch (cause) {
    return { data: [], error: formatSprintDataError(cause) };
  }
}

export const loadSprintPeriodTasks = cache(async function loadSprintPeriodTasks(
  project: string,
  team: string,
  _sprintPath: string,
  startDate: string | null,
  finishDate: string | null,
  assignee: string,
): Promise<SprintDataPart<AdoWorkItemOptionDto[]>> {
  if (!startDate || !finishDate) return { data: [], error: null };
  return loadWorkItemsInPeriod(
    project,
    team,
    { startDate, finishDate },
    assignee,
    listTasksInWorkingDateRange,
    "Conecta Azure DevOps para cargar tareas del periodo.",
  );
});

export const loadSprintPeriodBugs = cache(async function loadSprintPeriodBugs(
  project: string,
  team: string,
  _sprintPath: string,
  startDate: string | null,
  finishDate: string | null,
  assignee: string,
): Promise<SprintDataPart<AdoWorkItemOptionDto[]>> {
  if (!startDate || !finishDate) return { data: [], error: null };
  return loadWorkItemsInPeriod(
    project,
    team,
    { startDate, finishDate },
    assignee,
    listBugsInWorkingDateRange,
    "Conecta Azure DevOps para cargar Bugs del periodo.",
  );
});

export const loadSprintPeriodStories = cache(async function loadSprintPeriodStories(
  project: string,
  team: string,
  sprintPath: string,
  startDate: string | null,
  finishDate: string | null,
  assignee: string,
): Promise<SprintDataPart<AdoWorkItemOptionDto[]>> {
  // Historias del sprint y tareas del periodo no dependen entre sí: en paralelo.
  const [sprintStories, periodTasks] = await Promise.all([
    loadSprintWorkItems(project, sprintPath, assignee),
    loadSprintPeriodTasks(project, team, sprintPath, startDate, finishDate, assignee),
  ]);
  if (sprintStories.error || !startDate || !finishDate) return sprintStories;
  if (periodTasks.error) return sprintStories;

  const [auth, pbiAssigneeField] = await Promise.all([
    resolveScopedAuth(project),
    resolvePbiAssigneeField(),
  ]);
  if (!auth) return sprintStories;
  const backlogStories = await listParentStoriesForTasks(auth, periodTasks.data, {
    assignee,
    excludeIds: new Set(sprintStories.data.map((story) => story.id)),
    pbiAssigneeField,
  });
  if (backlogStories.length === 0) return sprintStories;

  const marked = backlogStories.map((story) => ({ ...story, fromBacklog: true }));
  const data = [...sprintStories.data, ...marked].sort((a, b) =>
    a.title.localeCompare(b.title, "es"),
  );
  return { data, error: null };
});

export const loadSprintBacklogStates = cache(async function loadSprintBacklogStates(
  project: string,
): Promise<SprintDataPart<AdoTaskStateDto[]>> {
  try {
    const auth = await resolveScopedAuth(project);
    if (!auth) {
      return { data: [], error: "Conecta Azure DevOps para cargar estados del backlog." };
    }
    const processProfile = await resolveProcessProfile(auth);
    const data = await listBacklogItemStates(auth, processProfile.backlogItemType);
    return { data, error: null };
  } catch (cause) {
    return { data: [], error: formatSprintDataError(cause) };
  }
});

export const loadSprintBugStates = cache(async function loadSprintBugStates(
  project: string,
): Promise<SprintDataPart<AdoTaskStateDto[]>> {
  try {
    const auth = await resolveScopedAuth(project);
    if (!auth) {
      return { data: [], error: "Conecta Azure DevOps para cargar estados de bugs." };
    }
    const processProfile = await resolveProcessProfile(auth);
    const data = await listBugStates(auth, processProfile.bugWorkItemType);
    return { data, error: null };
  } catch (cause) {
    return { data: [], error: formatSprintDataError(cause) };
  }
});

/**
 * Festivos del calendario único (holiday service) para el rango del sprint.
 * No depende de ADO: la fuente de días no hábiles es festivos + fin de
 * semana en toda la plataforma.
 */
export const loadSprintHolidayDates = cache(async function loadSprintHolidayDates(
  startDate: string | null,
  finishDate: string | null,
): Promise<SprintDataPart<string[]>> {
  if (!startDate || !finishDate) return { data: [], error: null };
  try {
    const data = await loadHolidayDateKeysInRange(startDate, finishDate);
    return { data, error: null };
  } catch (cause) {
    return { data: [], error: formatSprintDataError(cause) };
  }
});
