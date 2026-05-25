import "server-only";

import { cache } from "react";

import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { withAdoProject } from "@/lib/azure-devops/projects";
import {
  listBacklogItemStates,
  listTeamMembers,
} from "@/lib/azure-devops/work-item-type-states";
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
  if (!catalog.project || !catalog.team) return emptyMeta;

  const caller = await requireAdoCaller();
  if (!caller.ok) return emptyMeta;

  try {
    const scopedAuth = withAdoProject(caller.auth, catalog.project);
    const [teamMembers, backlogStates, responsableFields] = await Promise.all([
      listTeamMembers(scopedAuth, catalog.team),
      listBacklogItemStates(scopedAuth),
      loadWorkItemsBacklogFields(catalog.project),
    ]);
    return { teamMembers, backlogStates, responsableFields };
  } catch {
    return emptyMeta;
  }
});
