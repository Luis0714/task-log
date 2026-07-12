import "server-only";

import { cache } from "react";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { loadTeamMembers } from "@/lib/filters/load-team-members";
import type { SprintItemsKind } from "@/lib/sprint-items/types";
import {
  listBugStates,
  listTaskStates,
} from "@/lib/azure-devops/work-item-type-states";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
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
  if (!project.trim() || !team.trim()) return emptyMeta;

  const auth = await getScopedProjectAuth(project);
  if (!auth) return emptyMeta;

  try {
    const profile = await resolveProcessProfile(auth);
    const [members, states] = await Promise.all([
      loadTeamMembers({ project, team }),
      kind === "tasks"
        ? listTaskStates(auth, profile.taskWorkItemType)
        : listBugStates(auth, profile.bugWorkItemType),
    ]);
    return { members, states };
  } catch {
    return emptyMeta;
  }
});
