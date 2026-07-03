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

export type TeamMembersSource = "workItems" | "tasks" | "bugs";

export type LoadTeamMembersInput = {
  project: string;
  team: string;
  sprintPath?: string;
  /**
   * De dónde sacar los asignados extra del sprint:
   * - `undefined` o sin `sprintPath` → sólo roster del equipo.
   * - `"tasks"` → añade tasks del sprint que no están en el roster.
   * - `"bugs"` → idem con bugs.
   * - `"workItems"` (default) → añade todos los work items del sprint.
   */
  source?: TeamMembersSource;
};

/**
 * ÚNICA fuente de miembros del equipo para toda la app.
 *
 * Devuelve una lista ya deduplicada y ordenada alfabéticamente. Combina:
 *  1. Roster oficial del equipo (incluye `imageUrl` cuando ADO lo provee).
 *  2. Asignados reales del sprint que no están en el roster (sin imageUrl;
 *     el componente de avatar usa iniciales como fallback).
 *
 * Si falta `project`/`team` o no hay auth, devuelve `[]` para no romper
 * el render. Los errores se loguean en consola y se devuelven como array
 * vacío — los callers deben mostrar "sin opciones" en la UI.
 *
 * Cacheado con `react.cache` para deduplicar la llamada por request.
 */
export const loadTeamMembers = cache(async function loadTeamMembers(
  input: LoadTeamMembersInput,
): Promise<AdoTeamMemberDto[]> {
  const project = input.project?.trim() ?? "";
  const team = input.team?.trim() ?? "";
  if (!project || !team) return [];

  const auth = await getScopedProjectAuth(project);
  if (!auth) return [];

  try {
    const roster = await listTeamMembers(auth, team);

    const sprintPath = input.sprintPath?.trim() ?? "";
    if (!sprintPath) return roster;

    const sprintItems =
      input.source === "tasks"
        ? await loadSprintTasks(project, sprintPath, WORK_ITEM_ASSIGNEE_ALL)
        : input.source === "bugs"
          ? await loadSprintBugs(project, sprintPath, WORK_ITEM_ASSIGNEE_ALL)
          : await loadSprintWorkItems(
              project,
              sprintPath,
              WORK_ITEM_ASSIGNEE_ALL,
            );

    return mergeTeamMembersWithWorkItemAssignees(roster, sprintItems.data);
  } catch (cause) {
    console.error("loadTeamMembers failed", cause);
    return [];
  }
});