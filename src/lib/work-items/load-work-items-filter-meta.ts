import "server-only";

import { cache } from "react";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { loadTeamMembers } from "@/lib/filters/load-team-members";
import { listBacklogItemStates } from "@/lib/azure-devops/work-item-type-states";
import type { AdoTaskStateDto, AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";

export type WorkItemsFilterMeta = {
  members: AdoTeamMemberDto[];
  states: AdoTaskStateDto[];
};

const emptyMeta: WorkItemsFilterMeta = { members: [], states: [] };

export const loadWorkItemsFilterMeta = cache(async function loadWorkItemsFilterMeta(
  project: string,
  team: string,
): Promise<WorkItemsFilterMeta> {
  if (!project.trim() || !team.trim()) return emptyMeta;

  const auth = await getScopedProjectAuth(project);
  if (!auth) return emptyMeta;

  try {
    const [members, states] = await Promise.all([
      loadTeamMembers({ project, team }),
      listBacklogItemStates(auth),
    ]);
    return { members, states };
  } catch {
    return emptyMeta;
  }
});
