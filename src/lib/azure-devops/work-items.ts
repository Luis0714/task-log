import "server-only";

import {
  adoFetch,
  adoOrgBase,
  adoProjectBase,
  adoAuthHeader,
  escapeWiqlString,
} from "@/lib/azure-devops/client";
import { resolveAdoCaller, type AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { listTaskStates, resolveTaskWorkItemTypeName } from "@/lib/azure-devops/work-item-type-states";
import { resolveAdoProfile } from "@/lib/auth/resolve-ado-profile";
import { buildAssigneeWiqlCondition } from "@/lib/filters/assignee-wiql";
import { WORK_ITEM_ASSIGNEE_ALL } from "@/lib/schemas/work-item-filters";
import type { TaskActivity } from "@/lib/time-log/task-constants";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import {
  resolveAdoWorkingDateFieldValue,
  resolveWorkingTimeFromFields,
} from "@/lib/date/ado-datetime";
import { resolveWorkingDateKeyFromFields } from "@/lib/azure-devops/working-date-field";
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
import { getDefaultWorkingDate } from "@/lib/time-log/task-constants";
import {
  pickDefaultCompletedTaskState,
  pickDefaultOpenTaskState,
} from "@/lib/time-log/task-state-utils";

export type { AdoWorkItemOption } from "@/lib/azure-devops/work-items-filters";
import type { AdoWorkItemOption } from "@/lib/azure-devops/work-items-filters";

function authHeader(auth: AdoCallerAuth): string {
  return adoAuthHeader(auth);
}

const COMPLETED_WORK = "Microsoft.VSTS.Scheduling.CompletedWork";
const ORIGINAL_ESTIMATE = "Microsoft.VSTS.Scheduling.OriginalEstimate";
const ACTIVITY = "Microsoft.VSTS.Common.Activity";
const AREA_PATH = "System.AreaPath";
const ITERATION_PATH = "System.IterationPath";


export type CreateTaskParams = {
  pbiId: number;
  title: string;
  hours: number;
  description?: string;
  activity: TaskActivity;
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
  const adoWorkingDateValue =
    resolveAdoWorkingDateFieldValue(
      params.workingDate,
      params.workingTime,
      processProfile.timezone,
    ) ?? params.workingDate;
  const assignedTo = await resolveAssignedToValue(auth);
  const pbiUrl = `${adoOrgBase(auth)}/_apis/wit/workitems/${params.pbiId}`;
  const iterationPath = params.sprintPath.trim() || pbiContext.iterationPath;

  const taskStates = await listTaskStates(auth);
  if (taskStates.length === 0) {
    return {
      ok: false,
      status: 422,
      body: "No hay estados disponibles para Tarea en este proyecto.",
    };
  }

  const createStateName = pickDefaultOpenTaskState(taskStates);
  const createState =
    taskStates.find((state) => state.name === createStateName) ??
    taskStates.find((state) => state.category === "Proposed") ??
    taskStates[0];

  const ops: JsonPatchOp[] = [
    { op: "add", path: "/fields/System.Title", value: params.title.trim() },
    { op: "add", path: "/fields/System.State", value: createState.name },
    { op: "add", path: `/fields/${AREA_PATH}`, value: pbiContext.areaPath },
    { op: "add", path: `/fields/${ITERATION_PATH}`, value: iterationPath },
    { op: "add", path: `/fields/${COMPLETED_WORK}`, value: params.hours },
    { op: "add", path: `/fields/${ORIGINAL_ESTIMATE}`, value: params.hours },
    { op: "add", path: `/fields/${ACTIVITY}`, value: params.activity },
    {
      op: "add",
      path: `/fields/${processProfile.workingDateField}`,
      value: adoWorkingDateValue,
    },
    {
      op: "add",
      path: "/relations/-",
      value: {
        rel: "System.LinkTypes.Hierarchy-Reverse",
        url: pbiUrl,
      },
    },
  ];

  const description = params.description?.trim();
  if (description) {
    ops.push({ op: "add", path: "/fields/System.Description", value: description });
  }

  if (assignedTo) {
    ops.push({ op: "add", path: "/fields/System.AssignedTo", value: assignedTo });
  }

  const url = `${adoProjectBase(auth)}/_apis/wit/workitems/$Task?api-version=7.1`;
  const res = await adoFetch(auth, url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json-patch+json",
    },
    body: JSON.stringify(ops),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, status: res.status, body: body.slice(0, 500) };
  }

  const created = (await res.json()) as { id?: number };
  if (!created.id) {
    return { ok: false, status: 502, body: "Azure DevOps no devolvió el ID de la tarea creada." };
  }

  if (!params.markAsDone) {
    return { ok: true, taskId: created.id, completedWork: params.hours, markedAsDone: false };
  }

  const doneState = pickDefaultCompletedTaskState(taskStates);
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
  const base = `https://dev.azure.com/${encodeURIComponent(auth.organization)}/${encodeURIComponent(auth.project)}/_apis/wit/workitems`;
  const api = "api-version=7.1";
  const headers: Record<string, string> = {
    Authorization: authHeader(auth),
    "Content-Type": "application/json",
  };

  const getUrl = `${base}/${params.workItemId}?${api}&$fields=${encodeURIComponent(COMPLETED_WORK)}`;
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
  const currentRaw = wi.fields?.[COMPLETED_WORK];
  const current =
    typeof currentRaw === "number"
      ? currentRaw
      : typeof currentRaw === "string"
        ? Number.parseFloat(currentRaw)
        : 0;
  const previous = Number.isFinite(current) ? current : 0;
  const newCompletedWork = Math.round((previous + params.hours) * 100) / 100;

  const hadField =
    wi.fields?.[COMPLETED_WORK] !== undefined && wi.fields?.[COMPLETED_WORK] !== null;
  const patchOp = hadField ? "replace" : "add";

  const patchUrl = `${base}/${params.workItemId}?${api}`;
  const patchBody = JSON.stringify([
    { op: patchOp, path: `/fields/${COMPLETED_WORK}`, value: newCompletedWork },
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
const WI_COMPLETED_WORK = "Microsoft.VSTS.Scheduling.CompletedWork";
const WI_ORIGINAL_ESTIMATE = "Microsoft.VSTS.Scheduling.OriginalEstimate";
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

function parseAssignedToField(value: unknown): string {
  return parseIdentityDisplayName(value);
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

function resolveBacklogItemType(): string {
  return process.env.AZDO_BACKLOG_ITEM_TYPE?.trim() || "Product Backlog Item";
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
    WI_COMPLETED_WORK,
    WI_ORIGINAL_ESTIMATE,
    ...processProfile.workItemDateFieldNames,
    ...backlogFetchFields,
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
        assignedTo: parseAssignedToField(workItem.fields?.[ASSIGNED_TO]),
        priority: parseNumericField(workItem.fields?.[PRIORITY]),
        effort: parseEffortField(workItem.fields),
        parentId: parseNumericField(workItem.fields?.[PARENT]),
        loggedHours: parseNumericField(workItem.fields?.[WI_COMPLETED_WORK]),
        estimatedHours: parseNumericField(workItem.fields?.[WI_ORIGINAL_ESTIMATE]),
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
): Promise<AdoWorkItemOption[]> {
  try {
    const project = escapeWiqlString(auth.project);
    const path = escapeWiqlString(iterationPath);

    const conditions = [
      `[System.TeamProject] = '${project}'`,
      `[System.IterationPath] UNDER '${path}'`,
      `[System.State] <> 'Removed'`,
      `[System.WorkItemType] = '${escapeWiqlString(resolveTaskWorkItemTypeName())}'`,
    ];

    const assigneeCondition = buildAssigneeWiqlCondition(assignee);
    if (assigneeCondition) conditions.push(assigneeCondition);

    const wiql = {
      query: `SELECT [System.Id] FROM WorkItems WHERE ${conditions.join(" AND ")}`,
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

    const parents = await fetchWorkItemsByIds(auth, [...parentIds]);
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
  const assignee = filters.assignee?.trim() || WORK_ITEM_ASSIGNEE_ALL;
  const workItemType = filters.workItemType?.trim() || resolveBacklogItemType();
  const project = escapeWiqlString(auth.project);
  const path = escapeWiqlString(iterationPath);

  const conditions = [
    `[System.TeamProject] = '${project}'`,
    `[System.IterationPath] UNDER '${path}'`,
    `[System.State] <> 'Removed'`,
    `[System.WorkItemType] = '${escapeWiqlString(workItemType)}'`,
  ];

  const assigneeCondition = buildAssigneeWiqlCondition(assignee);
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
  if (workItemType !== resolveBacklogItemType()) return mainItems;

  const existingIds = new Set(mainItems.map((item) => item.id));
  const carryoverItems = await fetchCarryoverParents(auth, iterationPath, assignee, existingIds, workItemType);

  if (carryoverItems.length === 0) return mainItems;

  return [...mainItems, ...carryoverItems].sort((a, b) => a.title.localeCompare(b.title, "es"));
}

export async function listTasksInSprint(
  auth: AdoCallerAuth,
  iterationPath: string,
  filters: Omit<WorkItemSprintFilters, "workItemType"> = {},
): Promise<AdoWorkItemOption[]> {
  return listWorkItemsInSprint(auth, iterationPath, {
    ...filters,
    workItemType: resolveTaskWorkItemTypeName(),
  });
}

const SYSTEM_STATE = "System.State";

export type UpdateWorkItemStateResult =
  | { ok: true; state: string }
  | { ok: false; status: number; body: string };

function buildWorkingDatePatchOps(
  fields: Record<string, string | number | undefined> | undefined,
  dateValue: string,
  workingDateFieldNames: readonly string[],
): WorkItemFieldPatchOp[] {
  const ops: WorkItemFieldPatchOp[] = [];

  for (const fieldName of workingDateFieldNames) {
    const hadValue =
      fields?.[fieldName] !== undefined && fields?.[fieldName] !== null && fields?.[fieldName] !== "";
    ops.push({
      op: hadValue ? "replace" : "add",
      path: `/fields/${fieldName}`,
      value: dateValue,
    });
  }

  return ops;
}

function buildCompletedWorkPatchOps(
  fields: Record<string, string | number | undefined> | undefined,
  hours: number,
): WorkItemFieldPatchOp[] {
  const hadValue =
    fields?.[COMPLETED_WORK] !== undefined &&
    fields?.[COMPLETED_WORK] !== null &&
    fields?.[COMPLETED_WORK] !== "";

  return [
    {
      op: hadValue ? "replace" : "add",
      path: `/fields/${COMPLETED_WORK}`,
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
    COMPLETED_WORK,
    ...workingDateFieldNamesForUpdate,
    ...processProfile.workItemDateFieldNames,
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

  const dateValue =
    resolveAdoWorkingDateFieldValue(
      params.workingDate,
      params.workingTime,
      processProfile.timezone,
    ) ??
    resolveWorkingDateKeyFromFields(
      wi.fields,
      processProfile.workItemDateFieldNames,
      processProfile.timezone,
    ) ??
    getDefaultWorkingDate();

  const patchOps: WorkItemFieldPatchOp[] = [
    ...buildWorkingDatePatchOps(wi.fields, dateValue, workingDateFieldNamesForUpdate),
  ];

  if (params.completedWork !== undefined && Number.isFinite(params.completedWork)) {
    patchOps.push(...buildCompletedWorkPatchOps(wi.fields, params.completedWork));
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
    return {
      ok: false,
      status: patchRes.status,
      body: body.slice(0, 500) || "No se pudo actualizar el estado del work item.",
    };
  }

  return { ok: true, state };
}
