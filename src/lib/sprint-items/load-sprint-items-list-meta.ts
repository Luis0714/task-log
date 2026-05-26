import "server-only";

import { cache } from "react";

import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { withAdoProject } from "@/lib/azure-devops/projects";
import {
  listBugStates,
  listTaskStates,
  listTeamMembers,
} from "@/lib/azure-devops/work-item-type-states";
import type { AdoTaskStateDto, AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";
import type { SprintItemsKind } from "@/lib/sprint-items/types";

export type SprintItemsListMeta = {
  itemStates: AdoTaskStateDto[];
  teamMembers: AdoTeamMemberDto[];
};

export const loadSprintItemsListMeta = cache(async function loadSprintItemsListMeta(
  kind: SprintItemsKind,
  project: string,
  team: string,
): Promise<SprintItemsListMeta> {
  if (!project || !team) {
    return { itemStates: [], teamMembers: [] };
  }

  const caller = await requireAdoCaller();
  if (!caller.ok) {
    return { itemStates: [], teamMembers: [] };
  }

  try {
    const scopedAuth = withAdoProject(caller.auth, project);
    const [itemStates, teamMembers] = await Promise.all([
      kind === "tasks" ? listTaskStates(scopedAuth) : listBugStates(scopedAuth),
      listTeamMembers(scopedAuth, team),
    ]);
    return { itemStates, teamMembers };
  } catch {
    return { itemStates: [], teamMembers: [] };
  }
});
