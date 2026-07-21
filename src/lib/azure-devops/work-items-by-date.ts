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

/**
 * Campo estándar de Azure DevOps que contiene la fecha de creación del
 * work item (DateTime UTC). Se usa como referencia única para filtrar
 * bugs por rango de fechas, ya que el campo de fecha de trabajo no
 * siempre está poblado para ese tipo de elemento.
 */
export const BUG_CREATED_DATE_FIELD = "System.CreatedDate";

export function buildWorkingDateRangeConditions(
  workingDateField: string,
  startKey: string,
  endKey: string,
  timezone: string,
): string[] {
  return buildDateTimeFieldRangeConditions(workingDateField, startKey, endKey, timezone);
}

export function buildCreatedDateRangeConditions(
  startKey: string,
  endKey: string,
  timezone: string,
): string[] {
  return buildDateTimeFieldRangeConditions(BUG_CREATED_DATE_FIELD, startKey, endKey, timezone);
}

function buildDateTimeFieldRangeConditions(
  field: string,
  startKey: string,
  endKey: string,
  timezone: string,
): string[] {
  const startInstant = toAdoDateTimeValue(startKey, "00:00", timezone);
  const endExclusiveInstant = toAdoDateTimeValue(nextDayKey(endKey), "00:00", timezone);
  return [
    `[${field}] >= '${startInstant}'`,
    `[${field}] < '${endExclusiveInstant}'`,
  ];
}

/**
 * Condición WIQL `Completed Work > 0` o `null` si el proyecto no tiene
 * el campo configurado. Mantener la firma pura permite probarla sin
 * tocar la red ni instanciar `processProfile`.
 */
export function buildCompletedWorkGtZeroCondition(
  completedWorkField: string | null,
): string | null {
  if (!completedWorkField) return null;
  return `[${completedWorkField}] > '0'`;
}

async function listWorkItemsInWorkingDateRange(
  auth: AdoCallerAuth,
  workItemType: string,
  processProfile: Pick<
    AdoProcessProfile,
    "workingDateField" | "timezone" | "completedWorkField"
  >,
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

  const completedWorkCondition = buildCompletedWorkGtZeroCondition(
    processProfile.completedWorkField,
  );
  if (completedWorkCondition) conditions.push(completedWorkCondition);

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

/**
 * Lista bugs cuya fecha de creación cae dentro del rango recibido.
 *
 * A diferencia de `listBugsInWorkingDateRange`, NO usa el campo de fecha
 * de trabajo del proceso (que en bugs suele estar vacío). El sprint solo
 * aporta `startDate`/`finishDate`; la consulta se hace contra
 * `System.CreatedDate`, que es siempre un campo estándar poblado por
 * Azure DevOps al crear el elemento. El sprint NO se aplica como filtro
 * directo sobre los work items.
 */
export async function listBugsByCreatedDateRange(
  auth: AdoCallerAuth,
  range: WorkingDateRange,
  filters: WorkingDateRangeFilters = {},
): Promise<AdoWorkItemOption[]> {
  const start = toWiqlDateLiteral(range.startDate);
  const end = toWiqlDateLiteral(range.finishDate);
  if (!start || !end) return [];

  const processProfile = await resolveProcessProfile(auth);

  const conditions = [
    `[System.TeamProject] = '${escapeWiqlString(auth.project)}'`,
    `[System.WorkItemType] = '${escapeWiqlString(processProfile.bugWorkItemType)}'`,
    `[System.State] <> 'Removed'`,
    ...buildCreatedDateRangeConditions(start, end, processProfile.timezone),
  ];

  const teamCondition = await buildTeamScopeWiqlCondition(auth, filters.team);
  if (teamCondition) conditions.push(teamCondition);

  const completedWorkCondition = buildCompletedWorkGtZeroCondition(
    processProfile.completedWorkField,
  );
  if (completedWorkCondition) conditions.push(completedWorkCondition);

  const assignee = filters.assignee?.trim() || WORK_ITEM_ASSIGNEE_ALL;
  const assigneeCondition = buildAssigneeWiqlCondition(assignee);
  if (assigneeCondition) conditions.push(assigneeCondition);

  const ids = await runWiqlIdsQuery(
    auth,
    buildWiqlIdsQuery(conditions, "[System.ChangedDate] DESC"),
    "No se pudieron consultar los elementos de trabajo por fecha de creación.",
    { timePrecision: true },
  );
  return fetchWorkItemsByIds(auth, ids);
}

/**
 * Lista bugs cuya iteración (`System.IterationPath`) está bajo el path del
 * sprint indicado. NO usa el rango de fechas: el sprint aquí sí se aplica
 * como filtro directo porque la iteración es la asociación canónica del
 * bug al sprint (criterio 2 del filtrado por sprint).
 */
export async function listBugsByIterationPath(
  auth: AdoCallerAuth,
  sprintPath: string,
  filters: WorkingDateRangeFilters = {},
): Promise<AdoWorkItemOption[]> {
  const processProfile = await resolveProcessProfile(auth);
  const project = escapeWiqlString(auth.project);
  const path = escapeWiqlString(sprintPath);

  const conditions: string[] = [
    `[System.TeamProject] = '${project}'`,
    `[System.IterationPath] UNDER '${path}'`,
    `[System.State] <> 'Removed'`,
    `[System.WorkItemType] = '${escapeWiqlString(processProfile.bugWorkItemType)}'`,
  ];

  const teamCondition = await buildTeamScopeWiqlCondition(auth, filters.team);
  if (teamCondition) conditions.push(teamCondition);

  const assignee = filters.assignee?.trim() || WORK_ITEM_ASSIGNEE_ALL;
  const assigneeCondition = buildAssigneeWiqlCondition(assignee);
  if (assigneeCondition) conditions.push(assigneeCondition);

  const ids = await runWiqlIdsQuery(
    auth,
    buildWiqlIdsQuery(conditions, "[System.ChangedDate] DESC"),
    "No se pudieron consultar los bugs por iteración del sprint.",
  );
  return fetchWorkItemsByIds(auth, ids);
}

/**
 * Lista bugs cuya historia de usuario padre pertenece al sprint indicado,
 * independientemente de la iteración o la fecha de creación del bug
 * (criterio 3 del filtrado por sprint).
 */
export async function listBugsByParentIterationPath(
  auth: AdoCallerAuth,
  sprintPath: string,
  filters: WorkingDateRangeFilters = {},
): Promise<AdoWorkItemOption[]> {
  const processProfile = await resolveProcessProfile(auth);
  const project = escapeWiqlString(auth.project);
  const path = escapeWiqlString(sprintPath);

  const storyConditions: string[] = [
    `[System.TeamProject] = '${project}'`,
    `[System.IterationPath] UNDER '${path}'`,
    `[System.State] <> 'Removed'`,
    `[System.WorkItemType] = '${escapeWiqlString(processProfile.backlogItemType)}'`,
  ];
  const teamCondition = await buildTeamScopeWiqlCondition(auth, filters.team);
  if (teamCondition) storyConditions.push(teamCondition);

  const storyIds = await runWiqlIdsQuery(
    auth,
    buildWiqlIdsQuery(storyConditions),
    "No se pudieron consultar las historias del sprint para filtrar bugs por padre.",
  );
  if (storyIds.length === 0) return [];

  const bugConditions: string[] = [
    `[System.TeamProject] = '${project}'`,
    `[System.State] <> 'Removed'`,
    `[System.WorkItemType] = '${escapeWiqlString(processProfile.bugWorkItemType)}'`,
    `[System.Parent] IN (${storyIds.join(", ")})`,
  ];
  const assignee = filters.assignee?.trim() || WORK_ITEM_ASSIGNEE_ALL;
  const assigneeCondition = buildAssigneeWiqlCondition(assignee);
  if (assigneeCondition) bugConditions.push(assigneeCondition);

  const ids = await runWiqlIdsQuery(
    auth,
    buildWiqlIdsQuery(bugConditions, "[System.ChangedDate] DESC"),
    "No se pudieron consultar los bugs por historia padre del sprint.",
  );
  return fetchWorkItemsByIds(auth, ids);
}

/**
 * Lista todos los bugs relacionados con un sprint aplicando un OR entre
 * tres criterios (sin AND):
 *
 *   1. `System.CreatedDate` dentro del rango de fechas del sprint.
 *   2. `System.IterationPath` bajo el path del sprint.
 *   3. La historia de usuario padre está bajo el path del sprint.
 *
 * Los duplicados (mismo `id` por más de un criterio) se deduplican; el
 * orden es estable por `id`. Mantener la firma y la lógica de OR aquí
 * garantiza que Dashboard, módulo de Bugs y estadísticas compartan el
 * mismo criterio.
 */
export async function listBugsForSprint(
  auth: AdoCallerAuth,
  range: WorkingDateRange,
  sprintPath: string,
  filters: WorkingDateRangeFilters = {},
): Promise<AdoWorkItemOption[]> {
  const [byCreatedDate, byIteration, byParentIteration] = await Promise.all([
    listBugsByCreatedDateRange(auth, range, filters),
    listBugsByIterationPath(auth, sprintPath, filters),
    listBugsByParentIterationPath(auth, sprintPath, filters),
  ]);
  return dedupeBugsById([...byCreatedDate, ...byIteration, ...byParentIteration]);
}

/** Dedup preservando el primer encuentro por `id`. */
export function dedupeBugsById(
  bugs: readonly AdoWorkItemOption[],
): AdoWorkItemOption[] {
  const seen = new Map<number, AdoWorkItemOption>();
  for (const bug of bugs) {
    if (!seen.has(bug.id)) seen.set(bug.id, bug);
  }
  return [...seen.values()].sort((a, b) => a.id - b.id);
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
