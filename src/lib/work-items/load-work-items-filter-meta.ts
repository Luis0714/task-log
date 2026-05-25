import "server-only";

import { cache } from "react";

import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { withAdoProject } from "@/lib/azure-devops/projects";
import {
  listBacklogItemStates,
  listTeamMembers,
} from "@/lib/azure-devops/work-item-type-states";
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
  if (!project || !team) return emptyMeta;

  const caller = await requireAdoCaller();
  if (!caller.ok) return emptyMeta;

  try {
    const scopedAuth = withAdoProject(caller.auth, project);
    const [members, states] = await Promise.all([
      listTeamMembers(scopedAuth, team),
      listBacklogItemStates(scopedAuth),
    ]);
    return { members, states };
  } catch {
    return emptyMeta;
  }
});
