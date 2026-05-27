import "server-only";

import { cache } from "react";

import { loadSprintBugs, loadSprintTasks } from "@/lib/ado/load-sprint-data";
import type { SprintItemsKind } from "@/lib/sprint-items/types";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { mergeTeamMembersWithWorkItemAssignees } from "@/lib/filters/merge-team-members-with-assignees";
import { withAdoProject } from "@/lib/azure-devops/projects";
import {
  listBugStates,
  listTaskStates,
  listTeamMembers,
} from "@/lib/azure-devops/work-item-type-states";
import type { AdoTaskStateDto, AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";
import { WORK_ITEM_ASSIGNEE_ALL } from "@/lib/schemas/work-item-filters";

export type SprintItemsFilterMeta = {
  members: AdoTeamMemberDto[];
  states: AdoTaskStateDto[];
};

const emptyMeta: SprintItemsFilterMeta = { members: [], states: [] };

export const loadSprintItemsFilterMeta = cache(async function loadSprintItemsFilterMeta(
  kind: SprintItemsKind,
  project: string,
  team: string,
  sprintPath?: string,
): Promise<SprintItemsFilterMeta> {
  if (!project || !team) return emptyMeta;

  const caller = await requireAdoCaller();
  if (!caller.ok) return emptyMeta;

  const normalizedSprint = sprintPath?.trim() ?? "";

  try {
    const scopedAuth = withAdoProject(caller.auth, project);
    const sprintItemsPromise = normalizedSprint
      ? kind === "tasks"
        ? loadSprintTasks(project, normalizedSprint, WORK_ITEM_ASSIGNEE_ALL)
        : loadSprintBugs(project, normalizedSprint, WORK_ITEM_ASSIGNEE_ALL)
      : Promise.resolve({ data: [], error: null });

    const [members, states, sprintItems] = await Promise.all([
      listTeamMembers(scopedAuth, team),
      kind === "tasks" ? listTaskStates(scopedAuth) : listBugStates(scopedAuth),
      sprintItemsPromise,
    ]);

    return {
      members: mergeTeamMembersWithWorkItemAssignees(members, sprintItems.data),
      states,
    };
  } catch {
    return emptyMeta;
  }
});
