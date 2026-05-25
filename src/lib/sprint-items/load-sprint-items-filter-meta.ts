import "server-only";

import { cache } from "react";

import type { SprintItemsKind } from "@/lib/sprint-items/types";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { withAdoProject } from "@/lib/azure-devops/projects";
import {
  listBugStates,
  listTaskStates,
  listTeamMembers,
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
): Promise<SprintItemsFilterMeta> {
  if (!project || !team) return emptyMeta;

  const caller = await requireAdoCaller();
  if (!caller.ok) return emptyMeta;

  try {
    const scopedAuth = withAdoProject(caller.auth, project);
    const [members, states] = await Promise.all([
      listTeamMembers(scopedAuth, team),
      kind === "tasks" ? listTaskStates(scopedAuth) : listBugStates(scopedAuth),
    ]);
    return { members, states };
  } catch {
    return emptyMeta;
  }
});
