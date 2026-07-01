import "server-only";

import {
  adoFetch,
  adoOrgBase,
  adoProjectBase,
  adoAuthHeader,
  escapeWiqlString,
} from "@/lib/azure-devops/client";
import { resolveAdoCaller, type AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { listTaskStates } from "@/lib/azure-devops/work-item-type-states";
import { fetchActivityValues } from "@/lib/azure-devops/activity-values";
import { ADO_FIELD_DEFAULTS } from "@/lib/azure-devops/ado-field-defaults";
import { resolveAdoProfile } from "@/lib/auth/resolve-ado-profile";
import {
  buildAssigneeWiqlCondition,
  buildFieldAssigneeWiqlCondition,
} from "@/lib/filters/assignee-wiql";
import { WORK_ITEM_ASSIGNEE_ALL } from "@/lib/schemas/work-item-filters";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import { resolveWorkingTimeFromFields } from "@/lib/date/ado-datetime";
import {
  buildWorkingDateTimeValue,
  resolveWorkingDateKeyFromFields,
} from "@/lib/azure-devops/working-date-field";
import {
  fetchWorkItemsBatchWithFieldFallback,
  filterFieldsToProject,
} from "@/lib/azure-devops/wit-project-fields";
import {
  getBacklogItemFetchFieldNames,
  resolveBacklogResponsableFields,
} from "@/lib/azure-devops/backlog-item-fields";
import { parseIdentityDisplayName } from "@/lib/azure-devops/identity-field";
import { mapBacklogItemFields } from "@/lib/azure-devops/map-backlog-item-fields";
import { parseAdoWorkItemTags } from "@/lib/work-items/ado-work-item-tags";
import type { WorkItemFieldPatchOp } from "@/lib/azure-devops/work-item-patch";
import { toWorkingDateKey } from "@/lib/azure-devops/working-date-field";
import {
  pickDefaultCompletedTaskState,
  pickDefaultOpenTaskState,
} from "@/lib/time-log/task-state-utils";
import { parseRequiredEmptyFieldsFromAdoError } from "@/lib/azure-devops/ado-rule-errors";

export type { AdoWorkItemOption } from "@/lib/azure-devops/work-items-filters";
import type { AdoWorkItemOption } from "@/lib/azure-devops/work-items-filters";

function authHeader(auth: AdoCallerAuth): string {
  return adoAuthHeader(auth);
}

const AREA_PATH = "System.AreaPath";
const ITERATION_PATH = "System.IterationPath";


export type CreateTaskParams = {
  pbiId: number;
  title: string;
  hours: number;
  description?: string;
  activity?: string;
  workingDate: string;
  workingTime: string;
  state: string;
  sprintPath: string;
  markAsDone?: boolean;
};

export type CreateTaskUnderPbiResult =
  | { ok: true; taskId: number; completedWork: number; markedAsDone: boolean }
  | { ok: false; status: number; body: string };

type JsonPatchOp =
  | { op: "add"; path: string; value: string | number }
  | {
      op: "add";
      path: "/relations/-";
      value: { rel: string; url: string };
    }
  | { op: "replace"; path: string; value: string | number };

async function fetchPbiContext(
  auth: AdoCallerAuth,
  pbiId: number,
): Promise<
  | { ok: true; areaPath: string; iterationPath: string }
  | { ok: false; status: number; body: string }
> {
  const fields = [AREA_PATH, ITERATION_PATH].join(",");
  const url = `${adoProjectBase(auth)}/_apis/wit/workitems/${pbiId}?fields=${encodeURIComponent(fields)}&api-version=7.1`;
  const res = await adoFetch(auth, url);

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, status: res.status, body: body.slice(0, 500) };
  }

  const data = (await res.json()) as { fields?: Record<string, string | undefined> };
  const areaPath = data.fields?.[AREA_PATH]?.trim();
  const iterationPath = data.fields?.[ITERATION_PATH]?.trim();

  if (!areaPath || !iterationPath) {
    return {
      ok: false,
      status: 422,
      body: "No se pudo leer el área o la iteración de la historia de usuario padre.",
    };
  }

  return { ok: true, areaPath, iterationPath };
}

async function resolveAssignedToValue(auth: AdoCallerAuth): Promise<string | null> {
  const profile = await resolveAdoProfile(auth, { persist: true });
  if (!profile) return null;
  return profile.displayName.trim() || null;
}

export async function createTaskUnderPbi(
  params: CreateTaskParams,
  auth: AdoCallerAuth,
): Promise<CreateTaskUnderPbiResult> {
  const pbiContext = await fetchPbiContext(auth, params.pbiId);
  if (!pbiContext.ok) return pbiContext;

  const processProfile = await resolveProcessProfile(auth);
  const assignedTo = await resolveAssignedToValue(auth);
  const pbiUrl = `${adoOrgBase(auth)}/_apis/wit/workitems/${params.pbiId}`;
  const iterationPath = params.sprintPath.trim() || pbiContext.iterationPath;

  const taskStates = await listTaskStates(auth, processProfile.taskWorkItemType);
  if (taskStates.length === 0) {
    return {
      ok: false,
      status: 422,
      body: "No hay estados disponibles para Tarea en este proyecto.",
    };
  }

  if (params.activity) {
    const allowedActivities = await fetchActivityValues(auth);
    if (allowedActivities.length > 0 && !allowedActivities.includes(params.activity)) {
      return {
        ok: false,
        status: 422,
        body: `La actividad "${params.activity}" no está permitida. Valores válidos: ${allowedActivities.join(", ")}.`,
      };
    }
  }

  const createStateName = pickDefaultOpenTaskState(taskStates, processProfile.taskTodoState || null);
  const createState =
    taskStates.find((state) => state.name === createStateName) ??
    taskStates.find((state) => state.category === "Proposed") ??
    taskStates[0];

  const ops: JsonPatchOp[] = [
    { op: "add", path: "/fields/System.Title", value: params.title.trim() },
    { op: "add", path: "/fields/System.State", value: createState.name },
    { op: "add", path: `/fields/${AREA_PATH}`, value: pbiContext.areaPath },
    { op: "add", path: `/fields/${ITERATION_PATH}`, value: iterationPath },
  ];

  if (processProfile.completedWorkField) {
    ops.push({ op: "add", path: `/fields/${processProfile.completedWorkField}`, value: params.hours });
  }
  if (processProfile.originalEstimateField) {
    ops.push({ op: "add", path: `/fields/${processProfile.originalEstimateField}`, value: params.hours });
  }
  ops.push(
    {
      op: "add",
      path: `/fields/${processProfile.workingDateField}`,
      value: buildWorkingDateTimeValue(
        params.workingDate,
        params.workingTime,
        processProfile.timezone,
      ),
    },
    {
      op: "add",
      path: "/relations/-",
      value: {
        rel: "System.LinkTypes.Hierarchy-Reverse",
        url: pbiUrl,
      },
    },
  );

  if (processProfile.remainingWorkField) {
    ops.push({ op: "add", path: `/fields/${processProfile.remainingWorkField}`, value: 0 });
  }

  if (params.activity) {
    ops.push({ op: "add", path: `/fields/${ADO_FIELD_DEFAULTS.activityField}`, value: params.activity });
  }

  const description = params.description?.trim();
  if (description) {
    ops.push({ op: "add", path: "/fields/System.Description", value: description });
  }

  if (assignedTo) {
    ops.push({ op: "add", path: "/fields/System.AssignedTo", value: assignedTo });
  }

  const url = `${adoProjectBase(auth)}/_apis/wit/workitems/$${encodeURIComponent(processProfile.taskWorkItemType)}?api-version=7.1`;
  const workingDatePath = `/fields/${processProfile.workingDateField}`;

  let res = await adoFetch(auth, url, {
    method: "POST",
    headers: { "Content-Type": "application/json-patch+json" },
    body: JSON.stringify(ops),
  });

  if (!res.ok) {
    const errorBody = await res.text();

    // Some ADO process configurations restrict date fields in the initial task state
    // ("To Do"). Retry without the Working Date field — the Done transition sets it.
    if (
      res.status === 400 &&
      errorBody.includes("TF401320") &&
      ops.some((op) => "path" in op && op.path === workingDatePath)
    ) {
      const retryOps = ops.filter((op) => !("path" in op && op.path === workingDatePath));
      res = await adoFetch(auth, url, {
        method: "POST",
        headers: { "Content-Type": "application/json-patch+json" },
        body: JSON.stringify(retryOps),
      });
      if (!res.ok) {
        const retryErr = await res.text();
        return { ok: false, status: res.status, body: retryErr.slice(0, 500) };
      }
    } else {
      return { ok: false, status: res.status, body: errorBody.slice(0, 500) };
    }
  }

  const created = (await res.json()) as { id?: number };
  if (!created.id) {
    return { ok: false, status: 502, body: "Azure DevOps no devolvió el ID de la tarea creada." };
  }

  if (!params.markAsDone) {
    return { ok: true, taskId: created.id, completedWork: params.hours, markedAsDone: false };
  }

  const doneState = pickDefaultCompletedTaskState(taskStates, processProfile.taskDoneState || null);
  const markDoneResult = await updateWorkItemState(
    {
      workItemId: created.id,
      state: doneState,
      workingDate: params.workingDate,
      workingTime: params.workingTime,
      completedWork: params.hours,
    },
    auth,
  );

  if (!markDoneResult.ok) {
    return {
      ok: false,
      status: markDoneResult.status,
      body: `La tarea #${created.id} se creó, pero no se pudo marcar como Done: ${markDoneResult.body}`,
    };
  }

  return { ok: true, taskId: created.id, completedWork: params.hours, markedAsDone: true };
}

export async function logWorkOnWorkItem(
  params: { workItemId: number; hours: number; comment: string },
  auth: AdoCallerAuth,
): Promise<{ ok: true; newCompletedWork: number } | { ok: false; status: number; body: string }> {
  const processProfile = await resolveProcessProfile(auth);
  const { completedWorkField } = processProfile;

  if (!completedWorkField) {
    return {
      ok: false,
      status: 422,
      body: "Este proyecto no tiene configurado el campo de trabajo completado (Completed Work).",
    };
  }

  const base = `https://dev.azure.com/${encodeURIComponent(auth.organization)}/${encodeURIComponent(auth.project)}/_apis/wit/workitems`;
  const api = "api-version=7.1";
  const headers: Record<string, string> = {
    Authorization: authHeader(auth),
    "Content-Type": "application/json",
  };

  const getUrl = `${base}/${params.workItemId}?${api}&$fields=${encodeURIComponent(completedWorkField)}`;
  const getRes = await fetch(getUrl, { headers, cache: "no-store" });
  if (getRes.status === 401 || getRes.status === 403) {
    const body = await getRes.text();
    return {
      ok: false,
      status: getRes.status,
      body:
        getRes.status === 403
          ? "Permisos insuficientes en este proyecto (se requiere acceso de escritura a elementos de trabajo)."
          : body.slice(0, 500),
    };
  }
  if (!getRes.ok) {
    const body = await getRes.text();
    return { ok: false, status: getRes.status, body: body.slice(0, 500) };
  }

  const wi = (await getRes.json()) as { fields?: Record<string, number | string | undefined> };
  const currentRaw = wi.fields?.[completedWorkField];
  const current =
    typeof currentRaw === "number"
      ? currentRaw
      : typeof currentRaw === "string"
        ? Number.parseFloat(currentRaw)
        : 0;
  const previous = Number.isFinite(current) ? current : 0;
  const newCompletedWork = Math.round((previous + params.hours) * 100) / 100;

  const hadField =
    wi.fields?.[completedWorkField] !== undefined && wi.fields?.[completedWorkField] !== null;
  const patchOp = hadField ? "replace" : "add";

  const patchUrl = `${base}/${params.workItemId}?${api}`;
  const patchBody = JSON.stringify([
    { op: patchOp, path: `/fields/${completedWorkField}`, value: newCompletedWork },
  ]);

  const patchRes = await fetch(patchUrl, {
    method: "PATCH",
    headers: {
      ...headers,
      "Content-Type": "application/json-patch+json",
    },
    body: patchBody,
  });

  if (!patchRes.ok) {
    const body = await patchRes.text();
    return { ok: false, status: patchRes.status, body: body.slice(0, 500) };
  }

  const commentText = params.comment.trim();
  if (commentText) {
    const commentsUrl = `${base}/${params.workItemId}/comments?${api}-preview.3`;
    await fetch(commentsUrl, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: `[NeosView] +${params.hours}h — ${commentText}`,
      }),
    }).catch(() => undefined);
  }

  return { ok: true, newCompletedWork };
}

/** True si hay credenciales de usuario en sesión listas para llamar a Azure DevOps. */
export async function isAdoExecutionReady(): Promise<boolean> {
  return (await resolveAdoCaller()) !== null;
}

export type WorkItemSprintFilters = {
  assignee?: string;
  workItemType?: string;
  /**
   * Campo WIQL alternativo para filtrar la asignación al nivel de PBI/HU.
   * Si se omite, usa `System.AssignedTo`. Ejemplo: para QA, usar
   * `Custom.ResponsableQA` de forma que solo aparezcan los PBIs donde el
   * usuario sea el responsable QA.
   */
  pbiAssigneeField?: string;
};

type WiqlResponse = {
  workItems?: Array<{ id: number }>;
};

const TITLE = "System.Title";
const WORK_ITEM_TYPE = "System.WorkItemType";
const STATE = "System.State";
const ASSIGNED_TO = "System.AssignedTo";
const PRIORITY = "Microsoft.VSTS.Common.Priority";
const EFFORT = "Microsoft.VSTS.Scheduling.Effort";
const STORY_POINTS = "Microsoft.VSTS.Scheduling.StoryPoints";
const PARENT = "System.Parent";
const SYSTEM_TAGS = "System.Tags";
const DESCRIPTION_FIELD = "System.Description";
const ACCEPTANCE_CRITERIA_FIELD = "Microsoft.VSTS.Common.AcceptanceCriteria";
const ACTIVITY_FIELD = ADO_FIELD_DEFAULTS.activityField;
const REOPENED_WORKING_DATE_FIELD = "Custom.ReOpenedWorkingDate";
const REOPENED_BOOLEAN_FIELD = "Custom.Reopenedboolean";

function isReopenedStateName(state: string): boolean {
  return state.trim().toLowerCase() === "reopened";
}
function parseNumericField(value: string | number | undefined): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function parseEffortField(fields: Record<string, string | number | undefined> | undefined): number | undefined {
  return (
    parseNumericField(fields?.[EFFORT]) ?? parseNumericField(fields?.[STORY_POINTS])
  );
}

function parseRichTextField(value: string | number | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function adoListErrorMessage(res: Response, body: string, fallback: string): string {
  const snippet = body.trim().slice(0, 240);
  return snippet ? `HTTP ${res.status}: ${snippet}` : `HTTP ${res.status}: ${fallback}`;
}


async function fetchWorkItemDetails(
  auth: AdoCallerAuth,
  ids: number[],
): Promise<AdoWorkItemOption[]> {
  if (ids.length === 0) return [];

  const [responsableFields, processProfile, backlogFetchFields] = await Promise.all([
    resolveBacklogResponsableFields(auth),
    resolveProcessProfile(auth),
    getBacklogItemFetchFieldNames(auth),
  ]);

  const requestedFields = [
    TITLE,
    WORK_ITEM_TYPE,
    STATE,
    ASSIGNED_TO,
    PRIORITY,
    EFFORT,
    STORY_POINTS,
    PARENT,
    SYSTEM_TAGS,
    DESCRIPTION_FIELD,
    ACCEPTANCE_CRITERIA_FIELD,
    ACTIVITY_FIELD,
    ...processProfile.workItemDateFieldNames,
    ...backlogFetchFields,
    ...(processProfile.completedWorkField ? [processProfile.completedWorkField] : []),
    ...(processProfile.originalEstimateField ? [processProfile.originalEstimateField] : []),
  ];

  const chunkSize = 200;
  const items: AdoWorkItemOption[] = [];

  for (let index = 0; index < ids.length; index += chunkSize) {
    const chunk = ids.slice(index, index + chunkSize);
    const data = await fetchWorkItemsBatchWithFieldFallback(auth, chunk, requestedFields);
    for (const workItem of data.value ?? []) {
      const title = workItem.fields?.[TITLE];
      items.push({
        id: workItem.id,
        title: typeof title === "string" ? title : `Elemento de trabajo ${workItem.id}`,
        description: parseRichTextField(workItem.fields?.[DESCRIPTION_FIELD]),
        acceptanceCriteria: parseRichTextField(workItem.fields?.[ACCEPTANCE_CRITERIA_FIELD]),
        type: String(workItem.fields?.[WORK_ITEM_TYPE] ?? "Item"),
        state: String(workItem.fields?.[STATE] ?? ""),
        assignedTo: parseIdentityDisplayName(workItem.fields?.[ASSIGNED_TO]),
        priority: parseNumericField(workItem.fields?.[PRIORITY]),
        effort: parseEffortField(workItem.fields),
        parentId: parseNumericField(workItem.fields?.[PARENT]),
        loggedHours: processProfile.completedWorkField
          ? parseNumericField(workItem.fields?.[processProfile.completedWorkField])
          : undefined,
        estimatedHours: processProfile.originalEstimateField
          ? parseNumericField(workItem.fields?.[processProfile.originalEstimateField])
          : undefined,
        workingDate: resolveWorkingDateKeyFromFields(
          workItem.fields,
          processProfile.workItemDateFieldNames,
          processProfile.timezone,
        ),
        workingTime: resolveWorkingTimeFromFields(
          workItem.fields,
          processProfile.workingDateField,
          processProfile.timezone,
        ),
        tags: parseAdoWorkItemTags(
          typeof workItem.fields?.[SYSTEM_TAGS] === "string"
            ? workItem.fields[SYSTEM_TAGS]
            : undefined,
        ),
        activity:
          typeof workItem.fields?.[ACTIVITY_FIELD] === "string"
            ? (workItem.fields[ACTIVITY_FIELD] as string) || undefined
            : undefined,
        ...mapBacklogItemFields(workItem.fields, responsableFields),
      });
    }
  }

  return items.sort((a, b) => a.title.localeCompare(b.title, "es"));
}

export async function fetchWorkItemsByIds(
  auth: AdoCallerAuth,
  ids: readonly number[],
): Promise<AdoWorkItemOption[]> {
  return fetchWorkItemDetails(auth, [...ids]);
}

export async function enrichItemsWithParentTitles(
  auth: AdoCallerAuth,
  items: AdoWorkItemOption[],
): Promise<AdoWorkItemOption[]> {
  const parentIds = [...new Set(items.map((i) => i.parentId).filter((id): id is number => id !== undefined))];
  if (parentIds.length === 0) return items;

  try {
    const chunkSize = 200;
    const titleMap = new Map<number, string>();

    for (let i = 0; i < parentIds.length; i += chunkSize) {
      const chunk = parentIds.slice(i, i + chunkSize);
      const data = await fetchWorkItemsBatchWithFieldFallback(auth, chunk, [TITLE]);
      for (const wi of data.value ?? []) {
        const t = wi.fields?.[TITLE];
        if (typeof t === "string" && t.trim()) {
          titleMap.set(wi.id, t.trim());
        }
      }
    }

    return items.map((item) =>
      item.parentId !== undefined && titleMap.has(item.parentId)
        ? { ...item, parentTitle: titleMap.get(item.parentId) }
        : item,
    );
  } catch {
    return items;
  }
}

/**
 * Azure's sprint backlog shows a PBI even when its own IterationPath is a different sprint,
 * as long as one of its child Tasks lives in the queried sprint ("carryover parent").
 * This function replicates that rule (b): find Tasks in the sprint, read their parents,
 * fetch those parents, and return the ones not already in the main result.
 * Any failure degrades to an empty list so it can never break the main query.
 */
async function fetchCarryoverParents(
  auth: AdoCallerAuth,
  iterationPath: string,
  assignee: string,
  existingIds: Set<number>,
  backlogType: string,
  taskWorkItemType: string,
  pbiAssigneeField?: string,
): Promise<AdoWorkItemOption[]> {
  try {
    const project = escapeWiqlString(auth.project);
    const path = escapeWiqlString(iterationPath);

    // 1. Buscar tareas del sprint asignadas al usuario (siempre por System.AssignedTo).
    const taskConditions = [
      `[System.TeamProject] = '${project}'`,
      `[System.IterationPath] UNDER '${path}'`,
      `[System.State] <> 'Removed'`,
      `[System.WorkItemType] = '${escapeWiqlString(taskWorkItemType)}'`,
    ];

    const taskAssigneeCondition = buildAssigneeWiqlCondition(assignee);
    if (taskAssigneeCondition) taskConditions.push(taskAssigneeCondition);

    const wiql = {
      query: `SELECT [System.Id] FROM WorkItems WHERE ${taskConditions.join(" AND ")}`,
    };

    const url = `${adoProjectBase(auth)}/_apis/wit/wiql?api-version=7.1`;
    const res = await adoFetch(auth, url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(wiql),
    });

    if (!res.ok) return [];

    const data = (await res.json()) as WiqlResponse;
    const taskIds = (data.workItems ?? []).map((item) => item.id);
    if (taskIds.length === 0) return [];

    // 2. Encontrar los IDs de los PBIs padres de esas tareas.
    const chunkSize = 200;
    const parentIds = new Set<number>();

    for (let i = 0; i < taskIds.length; i += chunkSize) {
      const chunk = taskIds.slice(i, i + chunkSize);
      const parentData = await fetchWorkItemsBatchWithFieldFallback(auth, chunk, [PARENT]);
      for (const item of parentData.value ?? []) {
        const raw = item.fields?.[PARENT];
        if (typeof raw === "number" && Number.isFinite(raw) && !existingIds.has(raw)) {
          parentIds.add(raw);
        }
      }
    }

    if (parentIds.size === 0) return [];

    // 3. Filtrar los PBIs padres por el mismo criterio de asignación del usuario.
    //    Esto evita mostrar HUs de otros usuarios porque el usuario solo tiene
    //    tareas bajo ellas (no porque le estén asignadas).
    const pbiAssigneeCondition = pbiAssigneeField
      ? buildFieldAssigneeWiqlCondition(pbiAssigneeField, assignee)
      : buildAssigneeWiqlCondition(assignee);

    let filteredParentIds: number[];

    if (pbiAssigneeCondition) {
      const idList = [...parentIds].join(", ");
      const filterWiql = {
        query: `SELECT [System.Id] FROM WorkItems WHERE [System.Id] IN (${idList}) AND (${pbiAssigneeCondition})`,
      };
      const filterRes = await adoFetch(auth, url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filterWiql),
      });
      if (!filterRes.ok) return [];
      const filterData = (await filterRes.json()) as WiqlResponse;
      filteredParentIds = (filterData.workItems ?? []).map((item) => item.id);
    } else {
      filteredParentIds = [...parentIds];
    }

    if (filteredParentIds.length === 0) return [];

    const parents = await fetchWorkItemsByIds(auth, filteredParentIds);
    return parents.filter((item) => item.type === backlogType);
  } catch {
    return [];
  }
}

export async function listWorkItemsInSprint(
  auth: AdoCallerAuth,
  iterationPath: string,
  filters: WorkItemSprintFilters = {},
): Promise<AdoWorkItemOption[]> {
  const processProfile = await resolveProcessProfile(auth);
  const assignee = filters.assignee?.trim() || WORK_ITEM_ASSIGNEE_ALL;
  const workItemType = filters.workItemType?.trim() || processProfile.backlogItemType;
  const project = escapeWiqlString(auth.project);
  const path = escapeWiqlString(iterationPath);

  const conditions = [
    `[System.TeamProject] = '${project}'`,
    `[System.IterationPath] UNDER '${path}'`,
    `[System.State] <> 'Removed'`,
    `[System.WorkItemType] = '${escapeWiqlString(workItemType)}'`,
  ];

  // Para PBIs, el campo de asignación puede ser personalizado (ej. QA usa
  // Custom.ResponsableQA). Para tareas/bugs se usa siempre System.AssignedTo.
  const isPbiQuery = workItemType === processProfile.backlogItemType;
  const pbiField = filters.pbiAssigneeField;
  const assigneeCondition =
    isPbiQuery && pbiField
      ? buildFieldAssigneeWiqlCondition(pbiField, assignee)
      : buildAssigneeWiqlCondition(assignee);
  if (assigneeCondition) {
    conditions.push(assigneeCondition);
  }

  const wiql = {
    query: `SELECT [System.Id] FROM WorkItems WHERE ${conditions.join(" AND ")} ORDER BY [System.ChangedDate] DESC`,
  };

  const url = `${adoProjectBase(auth)}/_apis/wit/wiql?api-version=7.1`;
  const res = await adoFetch(auth, url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(wiql),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      adoListErrorMessage(res, body, "No se pudieron consultar los elementos de trabajo del sprint."),
    );
  }

  const data = (await res.json()) as WiqlResponse;
  const ids = (data.workItems ?? []).map((item) => item.id);
  const mainItems = await fetchWorkItemDetails(auth, ids);

  // Only the default backlog type (PBI/HU) can be a carryover parent of Tasks.
  // Queries for Bugs or other types skip this pass.
  if (!isPbiQuery) return mainItems;

  const existingIds = new Set(mainItems.map((item) => item.id));
  const carryoverItems = await fetchCarryoverParents(
    auth,
    iterationPath,
    assignee,
    existingIds,
    workItemType,
    processProfile.taskWorkItemType,
    pbiField,
  );

  if (carryoverItems.length === 0) return mainItems;

  return [...mainItems, ...carryoverItems].sort((a, b) => a.title.localeCompare(b.title, "es"));
}

export async function listTasksInSprint(
  auth: AdoCallerAuth,
  iterationPath: string,
  filters: Omit<WorkItemSprintFilters, "workItemType"> = {},
): Promise<AdoWorkItemOption[]> {
  const processProfile = await resolveProcessProfile(auth);
  return listWorkItemsInSprint(auth, iterationPath, {
    ...filters,
    workItemType: processProfile.taskWorkItemType,
  });
}

export async function listBugItemsInSprint(
  auth: AdoCallerAuth,
  iterationPath: string,
  filters: Omit<WorkItemSprintFilters, "workItemType"> = {},
): Promise<AdoWorkItemOption[]> {
  const processProfile = await resolveProcessProfile(auth);
  return listWorkItemsInSprint(auth, iterationPath, {
    ...filters,
    workItemType: processProfile.bugWorkItemType,
  });
}

const SYSTEM_STATE = "System.State";

export type UpdateWorkItemStateResult =
  | { ok: true; state: string }
  | { ok: false; status: number; body: string };

function looksLikeDateField(referenceName: string): boolean {
  const lower = referenceName.toLowerCase();
  // Cubre los nombres comunes en proyectos Scrum-like: Working Date, Fecha de
  // trabajo, FechaTrabajo, WorkingDate, FechaTrabajo, FechaInicio, StartDate, etc.
  return (
    lower.includes("date") ||
    lower.includes("fecha") ||
    lower.includes("working")
  );
}

function buildWorkingDatePatchOps(
  fields: Record<string, string | number | undefined> | undefined,
  dateKey: string,
  timeStr: string,
  timeZone: string,
  workingDateFieldNames: readonly string[],
): WorkItemFieldPatchOp[] {
  const value = buildWorkingDateTimeValue(dateKey, timeStr, timeZone);
  return workingDateFieldNames.map((fieldName) => {
    const hadValue =
      fields?.[fieldName] !== undefined && fields?.[fieldName] !== null && fields?.[fieldName] !== "";
    return {
      op: hadValue ? "replace" : "add",
      path: `/fields/${fieldName}`,
      value,
    };
  });
}

function buildCompletedWorkPatchOps(
  fields: Record<string, string | number | undefined> | undefined,
  hours: number,
  completedWorkField: string,
): WorkItemFieldPatchOp[] {
  const hadValue =
    fields?.[completedWorkField] !== undefined &&
    fields?.[completedWorkField] !== null &&
    fields?.[completedWorkField] !== "";

  return [
    {
      op: hadValue ? "replace" : "add",
      path: `/fields/${completedWorkField}`,
      value: Math.round(hours * 100) / 100,
    },
  ];
}

export async function updateWorkItemState(
  params: {
    workItemId: number;
    state: string;
    workingDate?: string;
    workingTime?: string;
    completedWork?: number;
    title?: string;
    description?: string;
    activity?: string;
    reopenedDate?: string;
  },
  auth: AdoCallerAuth,
): Promise<UpdateWorkItemStateResult> {
  const state = params.state.trim();
  if (!state) {
    return { ok: false, status: 400, body: "El estado no puede estar vacío." };
  }

  const processProfile = await resolveProcessProfile(auth);
  const workingDateFieldNamesForUpdate = [processProfile.workingDateField];

  const base = `${adoProjectBase(auth)}/_apis/wit/workitems`;
  const api = "api-version=7.1";
  const headers: Record<string, string> = {
    Authorization: authHeader(auth),
    "Content-Type": "application/json-patch+json",
  };

  const dateFields = [
    SYSTEM_STATE,
    ...workingDateFieldNamesForUpdate,
    ...processProfile.workItemDateFieldNames,
    ...(processProfile.completedWorkField ? [processProfile.completedWorkField] : []),
  ];
  const getFields = await filterFieldsToProject(auth, [...new Set(dateFields)]);
  const getUrl = `${base}/${params.workItemId}?${api}&$fields=${encodeURIComponent(getFields.join(","))}`;
  const getRes = await adoFetch(auth, getUrl);

  if (!getRes.ok) {
    const body = await getRes.text();
    return {
      ok: false,
      status: getRes.status,
      body: body.slice(0, 500) || "No se pudo leer el work item antes de actualizar.",
    };
  }

  const wi = (await getRes.json()) as {
    fields?: Record<string, string | number | undefined>;
  };

  const patchOps: WorkItemFieldPatchOp[] = [];

  if (params.workingDate) {
    patchOps.push(
      ...buildWorkingDatePatchOps(
        wi.fields,
        params.workingDate,
        params.workingTime ?? "12:00",
        processProfile.timezone,
        workingDateFieldNamesForUpdate,
      ),
    );
  }

  if (params.completedWork !== undefined && Number.isFinite(params.completedWork) && processProfile.completedWorkField) {
    patchOps.push(...buildCompletedWorkPatchOps(wi.fields, params.completedWork, processProfile.completedWorkField));
  }

  if (params.title) {
    patchOps.push({ op: "replace", path: `/fields/${TITLE}`, value: params.title.trim() });
  }

  if (params.description !== undefined) {
    patchOps.push({ op: "replace", path: `/fields/${DESCRIPTION_FIELD}`, value: params.description });
  }

  if (params.activity) {
    patchOps.push({ op: "replace", path: `/fields/${ACTIVITY_FIELD}`, value: params.activity.trim() });
  }

  if (isReopenedStateName(state)) {
    const reopenedDate = params.reopenedDate ? toWorkingDateKey(params.reopenedDate) : null;
    if (reopenedDate) {
      patchOps.push({ op: "replace", path: `/fields/${REOPENED_WORKING_DATE_FIELD}`, value: reopenedDate });
    }
    // Custom.Reopenedboolean es integer-typed (default "0" en el proceso).
    patchOps.push({ op: "replace", path: `/fields/${REOPENED_BOOLEAN_FIELD}`, value: 1 });
  }

  patchOps.push({ op: "replace", path: `/fields/${SYSTEM_STATE}`, value: state });

  const patchUrl = `${base}/${params.workItemId}?${api}`;
  const patchRes = await adoFetch(auth, patchUrl, {
    method: "PATCH",
    headers,
    body: JSON.stringify(patchOps),
  });

  if (!patchRes.ok) {
    const body = await patchRes.text();

    // Some ADO projects enforce field rules on state transitions (e.g. moving
    // a Bug to a "attended" state requires a custom Working Date field that
    // isn't in the process profile). When ADO reports a required+invalidEmpty
    // date-like field that we didn't include, retry with that field set to the
    // working date so the transition succeeds.
    //
    // Cubrimos tres formatos de error:
    //   1. TF401320 (rule validation) → parseamos `RuleValidationErrors`.
    //   2. Cuerpo con "Working Date"/"Fecha de trabajo" + "is required"/"required"
    //      → inferimos que ADO pide un campo de fecha custom.
    //   3. Cuerpo con "TF400813"/"TF50027" (resource field conflict) → reintentamos
    //      con todos los campos de fecha-like.
    const isRuleError = patchRes.status === 400 && body.includes("TF401320");
    const mentionsRequiredDate =
      patchRes.status === 400 &&
      params.workingDate &&
      /(working date|fecha\s+de\s+trabajo|workingdate)/i.test(body) &&
      /required|is required|requerid/i.test(body);
    const isResourceConflict =
      patchRes.status === 400 &&
      (body.includes("TF400813") || body.includes("TF50027"));
    // Some ADO processes mark the custom Working Date field as read-only on
    // certain work item types (e.g. Bug) so PATCH is rejected with
    // TF401320 "ReadOnly, InvalidNotOldValue". Drop the Working Date op and
    // let the state transition / workflow set it instead.
    const isReadOnlyWorkingDate =
      patchRes.status === 400 &&
      body.includes("TF401320") &&
      /(working date|fecha\s+de\s+trabajo|workingdate)/i.test(body) &&
      /readonly|invalidnotoldvalue/i.test(body);

    if (params.workingDate && (isRuleError || mentionsRequiredDate || isResourceConflict || isReadOnlyWorkingDate)) {
      const requiredFields = parseRequiredEmptyFieldsFromAdoError(body);
      const patchedPaths = new Set(patchOps.map((op) => op.path));

      // Si la respuesta no es TF401320 pero el cuerpo menciona un campo de fecha
      // requerido, no tenemos el reference name; pedimos al usuario configurar
      // el campo en Configuración → Proceso.
      const missingDateFields = requiredFields.filter(
        (f) => !patchedPaths.has(`/fields/${f}`) && looksLikeDateField(f),
      );

      // Fallback: si el cuerpo menciona un campo de fecha por su etiqueta pero no
      // viene en `RuleValidationErrors` (algunas versiones de ADO solo incluyen
      // el nombre legible), la app no puede inferir el Reference Name. Lo dejamos
      // pasar al cliente con un mensaje accionable.
      if (missingDateFields.length > 0) {
        const retryOps: WorkItemFieldPatchOp[] = [
          ...patchOps,
          ...missingDateFields.map((f): WorkItemFieldPatchOp => ({
            op: "add",
            path: `/fields/${f}`,
            value: params.workingDate as string,
          })),
        ];

        const retryRes = await adoFetch(auth, patchUrl, {
          method: "PATCH",
          headers,
          body: JSON.stringify(retryOps),
        });

        if (!retryRes.ok) {
          const retryBody = await retryRes.text();
          return {
            ok: false,
            status: retryRes.status,
            body: retryBody.slice(0, 500) || "No se pudo actualizar el estado del work item.",
          };
        }

        return { ok: true, state };
      }

      // Si ADO marca el Working Date como read-only en este work item type,
      // reintentamos sin esa op; el workflow / la transición de estado se
      // encarga del campo.
      if (isReadOnlyWorkingDate) {
        const workingDatePaths = new Set(
          workingDateFieldNamesForUpdate.map((f) => `/fields/${f}`),
        );
        const retryOps = patchOps.filter((op) => !workingDatePaths.has(op.path));

        if (retryOps.length < patchOps.length) {
          const retryRes = await adoFetch(auth, patchUrl, {
            method: "PATCH",
            headers,
            body: JSON.stringify(retryOps),
          });

          if (!retryRes.ok) {
            const retryBody = await retryRes.text();
            return {
              ok: false,
              status: retryRes.status,
              body:
                retryBody.slice(0, 500) ||
                "No se pudo actualizar el estado del work item.",
            };
          }

          return { ok: true, state };
        }
      }
    }

    return {
      ok: false,
      status: patchRes.status,
      body: body.slice(0, 500) || "No se pudo actualizar el estado del work item.",
    };
  }

  return { ok: true, state };
}

export type DeleteWorkItemResult =
  | { ok: true }
  | { ok: false; status: number; body: string };

export async function deleteWorkItem(
  workItemId: number,
  auth: AdoCallerAuth,
): Promise<DeleteWorkItemResult> {
  const url = `${adoProjectBase(auth)}/_apis/wit/workitems/${workItemId}?api-version=7.1`;
  const res = await adoFetch(auth, url, { method: "DELETE" });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, status: res.status, body: body.slice(0, 500) };
  }

  return { ok: true };
}

export type ChangeWorkItemParentResult =
  | { ok: true }
  | { ok: false; status: number; body: string };

export async function changeWorkItemParent(
  workItemId: number,
  newParentId: number,
  auth: AdoCallerAuth,
): Promise<ChangeWorkItemParentResult> {
  const api = "api-version=7.1";
  const base = `${adoProjectBase(auth)}/_apis/wit/workitems`;

  // Read current relations to find the index of the existing parent link
  const getUrl = `${base}/${workItemId}?${api}&$expand=relations`;
  const getRes = await adoFetch(auth, getUrl);
  if (!getRes.ok) {
    const body = await getRes.text();
    return { ok: false, status: getRes.status, body: body.slice(0, 500) };
  }

  const wi = (await getRes.json()) as {
    relations?: Array<{ rel: string; url: string }>;
  };

  const relations = wi.relations ?? [];
  const parentRelIndex = relations.findIndex(
    (r) => r.rel === "System.LinkTypes.Hierarchy-Reverse",
  );

  const newParentUrl = `${adoOrgBase(auth)}/_apis/wit/workitems/${newParentId}`;
  const headers: Record<string, string> = {
    Authorization: authHeader(auth),
    "Content-Type": "application/json-patch+json",
  };
  const patchUrl = `${base}/${workItemId}?${api}`;

  // If there's an existing parent, remove it and add new; otherwise just add.
  const ops: Array<{ op: string; path: string; value?: unknown }> = [];

  if (parentRelIndex >= 0) {
    ops.push({ op: "remove", path: `/relations/${parentRelIndex}` });
  }

  ops.push({
    op: "add",
    path: "/relations/-",
    value: { rel: "System.LinkTypes.Hierarchy-Reverse", url: newParentUrl },
  });

  const patchRes = await adoFetch(auth, patchUrl, {
    method: "PATCH",
    headers,
    body: JSON.stringify(ops),
  });

  if (!patchRes.ok) {
    const body = await patchRes.text();
    return { ok: false, status: patchRes.status, body: body.slice(0, 500) };
  }

  return { ok: true };
}
