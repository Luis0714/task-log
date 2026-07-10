import "server-only";

import { cache } from "react";

import type { WorkItemsListsSnapshot } from "@/lib/ado/types";
import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { loadTeamMembers } from "@/lib/filters/load-team-members";
import {
  listBacklogItemStates,
  listBugStates,
} from "@/lib/azure-devops/work-item-type-states";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import { listBugItemsInSprint, listWorkItemsInSprint } from "@/lib/azure-devops/work-items";
import { buildSprintStatusMapping } from "@/lib/dashboard/sprint-status-mapping";
import { WORK_ITEM_ASSIGNEE_ALL } from "@/lib/schemas/work-item-filters";

const emptyLists: WorkItemsListsSnapshot = {
  sprintWorkItems: [],
  sprintBugs: [],
  backlogStates: [],
  teamMembers: [],
  error: null,
};

export type LoadWorkItemsListsInput = {
  project: string;
  team: string;
  sprintPath: string;
  assignee: string;
};

export const loadWorkItemsLists = cache(async function loadWorkItemsLists(
  input: LoadWorkItemsListsInput,
): Promise<WorkItemsListsSnapshot> {
  const { project, team, sprintPath, assignee } = input;
  if (!project || !team || !sprintPath) return emptyLists;

  const auth = await getScopedProjectAuth(project);
  if (!auth) return emptyLists;

  try {
    const processProfile = await resolveProcessProfile(auth);
    const [sprintWorkItems, sprintBugs, backlogStates, bugStates, teamMembers] = await Promise.all([
      listWorkItemsInSprint(auth, sprintPath, { assignee }),
      listBugItemsInSprint(auth, sprintPath, { assignee: WORK_ITEM_ASSIGNEE_ALL }),
      listBacklogItemStates(auth, processProfile.backlogItemType),
      listBugStates(auth, processProfile.bugWorkItemType),
      loadTeamMembers({ project, team }),
    ]);

    const userStoryMapping = buildSprintStatusMapping(backlogStates);
    const bugMapping = buildSprintStatusMapping(bugStates);

    return {
      sprintWorkItems,
      sprintBugs,
      backlogStates,
      bugStates,
      userStoryMapping,
      bugMapping,
      teamMembers,
      error: null,
    };
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "Error desconocido";
    return {
      ...emptyLists,
      error: `No se pudieron cargar las historias del sprint. — ${detail}`,
    };
  }
});
