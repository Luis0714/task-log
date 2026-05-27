import "server-only";

import { cache } from "react";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { loadAssigneeFilterMembers } from "@/lib/filters/load-assignee-filter-members";
import { listBacklogItemStates } from "@/lib/azure-devops/work-item-type-states";
import type { AdoCatalogSnapshot } from "@/lib/ado/types";
import type { AdoTaskStateDto, AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";
import type { BacklogResponsableFieldDto } from "@/lib/schemas/ado-backlog-fields";
import { loadWorkItemsBacklogFields } from "@/lib/work-items/load-work-items-backlog-fields";

export type WorkItemsSheetMeta = {
  backlogStates: AdoTaskStateDto[];
  teamMembers: AdoTeamMemberDto[];
  responsableFields: BacklogResponsableFieldDto[];
};

const emptyMeta: WorkItemsSheetMeta = {
  backlogStates: [],
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
    const [teamMembers, backlogStates, responsableFields] = await Promise.all([
      loadAssigneeFilterMembers(
        catalog.project,
        catalog.team,
        catalog.sprintPath,
        "workItems",
      ),
      listBacklogItemStates(auth),
      loadWorkItemsBacklogFields(catalog.project),
    ]);
    return { teamMembers, backlogStates, responsableFields };
  } catch {
    return emptyMeta;
  }
});
