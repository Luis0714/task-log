import "server-only";

import { cache } from "react";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { loadTeamMembers } from "@/lib/filters/load-team-members";
import { listBacklogItemStates, listBugStates } from "@/lib/azure-devops/work-item-type-states";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type { AdoTaskStateDto, AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";
import type { BacklogResponsableFieldDto } from "@/lib/schemas/ado-backlog-fields";
import { loadWorkItemsBacklogFields } from "@/lib/work-items/load-work-items-backlog-fields";

export type WorkItemsSheetMeta = {
  backlogStates: AdoTaskStateDto[];
  bugStates: AdoTaskStateDto[];
  teamMembers: AdoTeamMemberDto[];
  responsableFields: BacklogResponsableFieldDto[];
};

const emptyMeta: WorkItemsSheetMeta = {
  backlogStates: [],
  bugStates: [],
  teamMembers: [],
  responsableFields: [],
};

export const loadWorkItemsSheetMeta = cache(async function loadWorkItemsSheetMeta(
  catalog: AdoCatalogSnapshot,
): Promise<WorkItemsSheetMeta> {
  if (!catalog.project?.trim() || !catalog.team?.trim()) return emptyMeta;

  const auth = await getScopedProjectAuth(catalog.project);
  if (!auth) return emptyMeta;

  try {
    const profile = await resolveProcessProfile(auth);
    const [teamMembers, backlogStates, bugStates, responsableFields] = await Promise.all([
      loadTeamMembers({
        project: catalog.project,
        team: catalog.team,
      }),
      listBacklogItemStates(auth, profile.backlogItemType),
      listBugStates(auth, profile.bugWorkItemType),
      loadWorkItemsBacklogFields(catalog.project),
    ]);
    return { teamMembers, backlogStates, bugStates, responsableFields };
  } catch {
    return emptyMeta;
  }
});
