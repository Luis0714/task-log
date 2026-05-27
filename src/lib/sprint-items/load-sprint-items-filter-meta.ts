import "server-only";

import { cache } from "react";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { loadAssigneeFilterMembers } from "@/lib/filters/load-assignee-filter-members";
import type { SprintItemsKind } from "@/lib/sprint-items/types";
import {
  listBugStates,
  listTaskStates,
} from "@/lib/azure-devops/work-item-type-states";
import type { AdoTaskStateDto, AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

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
  if (!project.trim() || !team.trim()) return emptyMeta;

  const auth = await getScopedProjectAuth(project);
  if (!auth) return emptyMeta;

  const sprintSource = kind === "tasks" ? "tasks" : "bugs";

  try {
    const [members, states] = await Promise.all([
      loadAssigneeFilterMembers(project, team, sprintPath, sprintSource),
      kind === "tasks" ? listTaskStates(auth) : listBugStates(auth),
    ]);
    return { members, states };
  } catch {
    return emptyMeta;
  }
});
