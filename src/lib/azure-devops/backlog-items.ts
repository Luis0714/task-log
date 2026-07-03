import "server-only";

import { escapeWiqlString } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { buildAssigneeWiqlCondition } from "@/lib/filters/assignee-wiql";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import { buildTeamScopeWiqlCondition } from "@/lib/azure-devops/team-field-values";
import { buildWiqlIdsQuery, runWiqlIdsQuery } from "@/lib/azure-devops/wiql";
import { fetchWorkItemsByIds } from "@/lib/azure-devops/work-items";
import type { AdoWorkItemOption } from "@/lib/azure-devops/work-items";
import { WORK_ITEM_ASSIGNEE_ALL } from "@/lib/schemas/work-item-filters";

/** Cota de historias enriquecidas por consulta; prioriza las de actividad más reciente. */
const BACKLOG_ITEMS_LIMIT = 500;

export type BacklogWorkItemsFilters = {
  assignee?: string;
  /** Acota a las áreas del equipo (mismo alcance que su backlog en Azure Boards). */
  team?: string;
};

export async function listBacklogWorkItems(
  auth: AdoCallerAuth,
  filters: BacklogWorkItemsFilters = {},
): Promise<AdoWorkItemOption[]> {
  const processProfile = await resolveProcessProfile(auth);

  const conditions = [
    `[System.TeamProject] = '${escapeWiqlString(auth.project)}'`,
    `[System.WorkItemType] = '${escapeWiqlString(processProfile.backlogItemType)}'`,
    `[System.State] <> 'Removed'`,
  ];

  const teamCondition = await buildTeamScopeWiqlCondition(auth, filters.team);
  if (teamCondition) conditions.push(teamCondition);

  const assignee = filters.assignee?.trim() || WORK_ITEM_ASSIGNEE_ALL;
  const assigneeCondition = buildAssigneeWiqlCondition(assignee);
  if (assigneeCondition) conditions.push(assigneeCondition);

  const ids = await runWiqlIdsQuery(
    auth,
    buildWiqlIdsQuery(conditions, "[System.ChangedDate] DESC"),
    "No se pudieron consultar las historias del backlog.",
  );
  return fetchWorkItemsByIds(auth, ids.slice(0, BACKLOG_ITEMS_LIMIT));
}
