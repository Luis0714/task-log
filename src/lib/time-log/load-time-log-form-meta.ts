import "server-only";

import { cache } from "react";

import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import { loadNonWorkingDates } from "@/lib/ado/load-non-working-dates";
import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { loadAssigneeFilterMembers } from "@/lib/filters/load-assignee-filter-members";
import {
  listBacklogItemStates,
  listTaskStates,
} from "@/lib/azure-devops/work-item-type-states";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
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
  const [teamMembers, backlogStates, taskStates, nonWorkingDates] = await Promise.all([
    loadAssigneeFilterMembers(
      catalog.project,
      catalog.team,
      catalog.sprintPath,
      "workItems",
    ),
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
