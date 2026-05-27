import "server-only";

import { cache } from "react";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { loadAssigneeFilterMembers } from "@/lib/filters/load-assignee-filter-members";
import {
  listBugStates,
  listTaskStates,
} from "@/lib/azure-devops/work-item-type-states";
import type { AdoTaskStateDto, AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";
import type { SprintItemsKind } from "@/lib/sprint-items/types";

export type SprintItemsListMeta = {
  itemStates: AdoTaskStateDto[];
  teamMembers: AdoTeamMemberDto[];
};

const emptyMeta: SprintItemsListMeta = { itemStates: [], teamMembers: [] };

export const loadSprintItemsListMeta = cache(async function loadSprintItemsListMeta(
  kind: SprintItemsKind,
  project: string,
  team: string,
  sprintPath?: string,
): Promise<SprintItemsListMeta> {
  if (!project.trim() || !team.trim()) return emptyMeta;

  const auth = await getScopedProjectAuth(project);
  if (!auth) return emptyMeta;

  const sprintSource = kind === "tasks" ? "tasks" : "bugs";

  try {
    const [itemStates, teamMembers] = await Promise.all([
      kind === "tasks" ? listTaskStates(auth) : listBugStates(auth),
      loadAssigneeFilterMembers(project, team, sprintPath, sprintSource),
    ]);
    return { itemStates, teamMembers };
  } catch {
    return emptyMeta;
  }
});
