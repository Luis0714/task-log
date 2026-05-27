import "server-only";

import { cache } from "react";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import {
  loadSprintBugs,
  loadSprintTasks,
  loadSprintWorkItems,
} from "@/lib/ado/load-sprint-data";
import { mergeTeamMembersWithWorkItemAssignees } from "@/lib/filters/merge-team-members-with-assignees";
import { listTeamMembers } from "@/lib/azure-devops/work-item-type-states";
import type { AdoTeamMemberDto } from "@/lib/schemas/ado-catalog";
import { WORK_ITEM_ASSIGNEE_ALL } from "@/lib/schemas/work-item-filters";

export type SprintAssigneeSource = "workItems" | "tasks" | "bugs";

/**
 * Única fuente para listas de persona en filtros y selects.
 * Roster del equipo + asignados reales del sprint (p. ej. externos al equipo).
 */
export const loadAssigneeFilterMembers = cache(async function loadAssigneeFilterMembers(
  project: string,
  team: string,
  sprintPath?: string,
  sprintSource: SprintAssigneeSource = "workItems",
): Promise<AdoTeamMemberDto[]> {
  if (!project.trim() || !team.trim()) return [];

  const auth = await getScopedProjectAuth(project);
  if (!auth) return [];

  try {
    const members = await listTeamMembers(auth, team);
    const normalizedSprint = sprintPath?.trim() ?? "";
    if (!normalizedSprint) return members;

    const sprintItems =
      sprintSource === "tasks"
        ? await loadSprintTasks(project, normalizedSprint, WORK_ITEM_ASSIGNEE_ALL)
        : sprintSource === "bugs"
          ? await loadSprintBugs(project, normalizedSprint, WORK_ITEM_ASSIGNEE_ALL)
          : await loadSprintWorkItems(
              project,
              normalizedSprint,
              WORK_ITEM_ASSIGNEE_ALL,
            );

    return mergeTeamMembersWithWorkItemAssignees(members, sprintItems.data);
  } catch {
    return [];
  }
});
