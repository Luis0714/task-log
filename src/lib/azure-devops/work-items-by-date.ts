import "server-only";

import { escapeWiqlString } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import {
  buildAssigneeWiqlCondition,
  buildFieldAssigneeWiqlCondition,
} from "@/lib/filters/assignee-wiql";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import type { AdoProcessProfile } from "@/lib/azure-devops/process-profile-types";
import { buildTeamScopeWiqlCondition } from "@/lib/azure-devops/team-field-values";
import {
  buildWiqlIdsQuery,
  filterWorkItemIdsByCondition,
  runWiqlIdsQuery,
  toWiqlDateLiteral,
} from "@/lib/azure-devops/wiql";
import { fetchWorkItemsByIds } from "@/lib/azure-devops/work-items";
import type { AdoWorkItemOption } from "@/lib/azure-devops/work-items";
import { toAdoDateTimeValue } from "@/lib/date/ado-datetime";
import { WORK_ITEM_ASSIGNEE_ALL } from "@/lib/schemas/work-item-filters";

export type WorkingDateRange = {
  /** Fecha civil o ISO; solo se usa la parte YYYY-MM-DD (inclusive). */
  startDate: string;
  finishDate: string;
};

export type WorkingDateRangeFilters = {
  assignee?: string;
  /** Acota a las áreas del equipo (mismo alcance que su backlog en Azure Boards). */
  team?: string;
};

function nextDayKey(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

export function buildWorkingDateRangeConditions(
  workingDateField: string,
  startKey: string,
  endKey: string,
  timezone: string,
): string[] {
  const startInstant = toAdoDateTimeValue(startKey, "00:00", timezone);
  const endExclusiveInstant = toAdoDateTimeValue(nextDayKey(endKey), "00:00", timezone);
  return [
    `[${workingDateField}] >= '${startInstant}'`,
    `[${workingDateField}] < '${endExclusiveInstant}'`,
  ];
}

async function listWorkItemsInWorkingDateRange(
  auth: AdoCallerAuth,
  workItemType: string,
  processProfile: Pick<AdoProcessProfile, "workingDateField" | "timezone">,
  range: WorkingDateRange,
  filters: WorkingDateRangeFilters,
): Promise<AdoWorkItemOption[]> {
  const start = toWiqlDateLiteral(range.startDate);
  const end = toWiqlDateLiteral(range.finishDate);
  if (!start || !end) return [];

  const conditions = [
    `[System.TeamProject] = '${escapeWiqlString(auth.project)}'`,
    `[System.WorkItemType] = '${escapeWiqlString(workItemType)}'`,
    `[System.State] <> 'Removed'`,
    ...buildWorkingDateRangeConditions(
      processProfile.workingDateField,
      start,
      end,
      processProfile.timezone,
    ),
  ];

  const teamCondition = await buildTeamScopeWiqlCondition(auth, filters.team);
  if (teamCondition) conditions.push(teamCondition);

  const assignee = filters.assignee?.trim() || WORK_ITEM_ASSIGNEE_ALL;
  const assigneeCondition = buildAssigneeWiqlCondition(assignee);
  if (assigneeCondition) conditions.push(assigneeCondition);

  const ids = await runWiqlIdsQuery(
    auth,
    buildWiqlIdsQuery(conditions, "[System.ChangedDate] DESC"),
    "No se pudieron consultar los elementos de trabajo por fecha de trabajo.",
    { timePrecision: true },
  );
  return fetchWorkItemsByIds(auth, ids);
}

export async function listTasksInWorkingDateRange(
  auth: AdoCallerAuth,
  range: WorkingDateRange,
  filters: WorkingDateRangeFilters = {},
): Promise<AdoWorkItemOption[]> {
  const processProfile = await resolveProcessProfile(auth);
  return listWorkItemsInWorkingDateRange(
    auth,
    processProfile.taskWorkItemType,
    processProfile,
    range,
    filters,
  );
}

export async function listBugsInWorkingDateRange(
  auth: AdoCallerAuth,
  range: WorkingDateRange,
  filters: WorkingDateRangeFilters = {},
): Promise<AdoWorkItemOption[]> {
  const processProfile = await resolveProcessProfile(auth);
  return listWorkItemsInWorkingDateRange(
    auth,
    processProfile.bugWorkItemType,
    processProfile,
    range,
    filters,
  );
}

export type ParentStoriesOptions = {
  assignee: string;
  excludeIds?: ReadonlySet<number>;
  pbiAssigneeField?: string;
};

/**
 * Historias padre de las tareas indicadas que no están en `excludeIds`,
 * filtradas por el responsable según rol (mismo criterio que el sprint).
 * Cualquier fallo degrada a lista vacía para no romper la vista principal.
 */
export async function listParentStoriesForTasks(
  auth: AdoCallerAuth,
  tasks: readonly Pick<AdoWorkItemOption, "parentId">[],
  options: ParentStoriesOptions,
): Promise<AdoWorkItemOption[]> {
  try {
    const excludeIds = options.excludeIds ?? new Set<number>();
    const parentIds = [
      ...new Set(
        tasks
          .map((task) => task.parentId)
          .filter((id): id is number => id !== undefined && !excludeIds.has(id)),
      ),
    ];
    if (parentIds.length === 0) return [];

    const assigneeCondition = options.pbiAssigneeField
      ? buildFieldAssigneeWiqlCondition(options.pbiAssigneeField, options.assignee)
      : buildAssigneeWiqlCondition(options.assignee);

    const assignedIds = assigneeCondition
      ? await filterWorkItemIdsByCondition(
          auth,
          parentIds,
          assigneeCondition,
          "No se pudieron filtrar las historias por responsable.",
        )
      : parentIds;
    if (assignedIds.length === 0) return [];

    const processProfile = await resolveProcessProfile(auth);
    const parents = await fetchWorkItemsByIds(auth, assignedIds);
    return parents.filter((item) => item.type === processProfile.backlogItemType);
  } catch {
    return [];
  }
}
