import "server-only";

import { cache } from "react";

import { loadSprintWorkItems } from "@/lib/ado/load-sprint-data";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { mergeTeamMembersWithWorkItemAssignees } from "@/lib/filters/merge-team-members-with-assignees";
import { withAdoProject } from "@/lib/azure-devops/projects";
import {
  listBacklogItemStates,
  listTeamMembers,
} from "@/lib/azure-devops/work-item-type-states";
import type { AdoTaskStateDto, AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";
import { WORK_ITEM_ASSIGNEE_ALL } from "@/lib/schemas/work-item-filters";

export type WorkItemsFilterMeta = {
  members: AdoTeamMemberDto[];
  states: AdoTaskStateDto[];
};

const emptyMeta: WorkItemsFilterMeta = { members: [], states: [] };

export const loadWorkItemsFilterMeta = cache(async function loadWorkItemsFilterMeta(
  project: string,
  team: string,
  sprintPath?: string,
): Promise<WorkItemsFilterMeta> {
  if (!project || !team) return emptyMeta;

  const caller = await requireAdoCaller();
  if (!caller.ok) return emptyMeta;

  const normalizedSprint = sprintPath?.trim() ?? "";

  try {
    const scopedAuth = withAdoProject(caller.auth, project);
    const sprintWorkItemsPromise = normalizedSprint
      ? loadSprintWorkItems(project, normalizedSprint, WORK_ITEM_ASSIGNEE_ALL)
      : Promise.resolve({ data: [], error: null });

    const [members, states, sprintWorkItems] = await Promise.all([
      listTeamMembers(scopedAuth, team),
      listBacklogItemStates(scopedAuth),
      sprintWorkItemsPromise,
    ]);

    return {
      members: mergeTeamMembersWithWorkItemAssignees(members, sprintWorkItems.data),
      states,
    };
  } catch {
    return emptyMeta;
  }
});
