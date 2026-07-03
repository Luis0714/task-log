import "server-only";

import { cache } from "react";

import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { loadNonWorkingDates } from "@/lib/ado/load-non-working-dates";
import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { loadTeamMembers } from "@/lib/filters/load-team-members";
import {
  listBacklogItemStates,
  listTaskStates,
} from "@/lib/azure-devops/work-item-type-states";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import { isBacklogScope } from "@/lib/time-log/backlog-scope";
import { pickSprint } from "@/lib/time-log/context-defaults";
import {
  pickDefaultCompletedTaskState,
  resolveTaskStateSelection,
} from "@/lib/time-log/task-state-utils";
import type { AdoTaskStateDto, AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

export type TimeLogFormMeta = {
  teamMembers: AdoTeamMemberDto[];
  backlogStates: Awaited<ReturnType<typeof listBacklogItemStates>>;
  taskStates: AdoTaskStateDto[];
  defaultOpenTaskState: string | null;
  defaultCompletedTaskState: string | null;
  nonWorkingDates: string[];
};

const emptyMeta: TimeLogFormMeta = {
  teamMembers: [],
  backlogStates: [],
  taskStates: [],
  defaultOpenTaskState: null,
  defaultCompletedTaskState: null,
  nonWorkingDates: [],
};

export const loadTimeLogFormMeta = cache(async function loadTimeLogFormMeta(
  catalog: AdoCatalogSnapshot,
): Promise<TimeLogFormMeta> {
  if (!catalog.project?.trim() || !catalog.team?.trim()) return emptyMeta;

  const auth = await getScopedProjectAuth(catalog.project);
  if (!auth) return emptyMeta;

  const profile = await resolveProcessProfile(auth);
  // En scope backlog no hay sprint del cual leer miembros; usa el preferente.
  const membersSprintPath = isBacklogScope(catalog.sprintPath)
    ? pickSprint("", catalog.sprints)
    : catalog.sprintPath;
  const [teamMembers, backlogStates, taskStates, nonWorkingDates] = await Promise.all([
    loadTeamMembers({
      project: catalog.project,
      team: catalog.team,
      sprintPath: membersSprintPath,
      source: "workItems",
    }),
    listBacklogItemStates(auth, profile.backlogItemType),
    listTaskStates(auth, profile.taskWorkItemType),
    loadNonWorkingDates(catalog.project, catalog.team),
  ]);

  const defaultOpenTaskState =
    taskStates.length > 0 ? resolveTaskStateSelection(taskStates, "") : null;
  const defaultCompletedTaskState =
    taskStates.length > 0 ? pickDefaultCompletedTaskState(taskStates) : null;

  return {
    teamMembers,
    backlogStates,
    taskStates,
    defaultOpenTaskState,
    defaultCompletedTaskState,
    nonWorkingDates,
  };
});
