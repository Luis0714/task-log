import "server-only";

import { cache } from "react";

import type { WorkItemsListsSnapshot } from "@/lib/ado/types";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import {
  listBacklogItemStates,
  listTeamMembers,
} from "@/lib/azure-devops/work-item-type-states";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { listWorkItemsInSprint } from "@/lib/azure-devops/work-items";
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

  const caller = await requireAdoCaller();
  if (!caller.ok) return emptyLists;

  try {
    const scopedAuth = withAdoProject(caller.auth, project);
    const [sprintWorkItems, sprintBugs, backlogStates, teamMembers] = await Promise.all([
      listWorkItemsInSprint(scopedAuth, sprintPath, { assignee }),
      listWorkItemsInSprint(scopedAuth, sprintPath, {
        assignee: WORK_ITEM_ASSIGNEE_ALL,
        workItemType: "Bug",
      }),
      listBacklogItemStates(scopedAuth),
      listTeamMembers(scopedAuth, team),
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
