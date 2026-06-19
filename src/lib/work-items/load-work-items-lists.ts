import "server-only";

import { cache } from "react";

import type { WorkItemsListsSnapshot } from "@/lib/ado/types";
import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { loadAssigneeFilterMembers } from "@/lib/filters/load-assignee-filter-members";
import { listBacklogItemStates } from "@/lib/azure-devops/work-item-type-states";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import { listBugItemsInSprint, listWorkItemsInSprint } from "@/lib/azure-devops/work-items";
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
    const [sprintWorkItems, sprintBugs, backlogStates, teamMembers] = await Promise.all([
      listWorkItemsInSprint(auth, sprintPath, { assignee }),
      listBugItemsInSprint(auth, sprintPath, { assignee: WORK_ITEM_ASSIGNEE_ALL }),
      listBacklogItemStates(auth, processProfile.backlogItemType),
      loadAssigneeFilterMembers(project, team, sprintPath, "workItems"),
    ]);

    return {
      sprintWorkItems,
      sprintBugs,
      backlogStates,
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
