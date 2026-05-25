import "server-only";

import { isOAuthAuthMethod, isPatAuthMethod } from "@/lib/auth/auth-method";
import {
  adoFetch,
  adoOrgBase,
  adoProjectBase,
  adoAuthHeader,
  escapeWiqlString,
} from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { isPatConfigured } from "@/lib/azure-devops/resolve-auth";
import { listTaskStates, resolveTaskWorkItemTypeName } from "@/lib/azure-devops/work-item-type-states";
import { resolveAdoProfile } from "@/lib/auth/resolve-ado-profile";
import { isIronSessionConfigured } from "@/lib/auth/session";
import { getTaskPilotSession } from "@/lib/auth/session";
import {
  isWorkItemAssigneeAll,
  isWorkItemAssigneeMe,
  WORK_ITEM_ASSIGNEE_ALL,
} from "@/lib/schemas/work-item-filters";
import type { TaskActivity } from "@/lib/time-log/task-constants";
import {
  getWorkItemDateFieldNames,
  getWorkingDateFieldNamesForUpdate,
  resolveWorkingDateFieldName,
  resolveWorkingDateKeyFromFields,
  toWorkingDateKey,
} from "@/lib/azure-devops/working-date-field";
import { getDefaultWorkingDate } from "@/lib/time-log/task-constants";
import { pickDefaultOpenTaskState } from "@/lib/time-log/task-state-utils";

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
  state: string;
  sprintPath: string;
};

type JsonPatchOp =
  | { op: "add"; path: string; value: string | number }
  | {
      op: "add";
      path: "/relations/-";
      value: { rel: string; url: string };
    }
  | { op: "replace"; path: string; value: string | number };

async function patchWorkItemFields(
  auth: AdoCallerAuth,
  taskId: number,
  ops: Array<{ op: "replace" | "add"; path: string; value: string | number }>,
): Promise<{ ok: true } | { ok: false; status: number; body: string }> {
  const url = `${adoProjectBase(auth)}/_apis/wit/workitems/${taskId}?api-version=7.1`;
  const res = await adoFetch(auth, url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json-patch+json",
    },
    body: JSON.stringify(ops),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, status: res.status, body: body.slice(0, 500) };
  }

  return { ok: true };
}

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
      body: "No se pudo leer el área o la iteración del PBI padre.",
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
): Promise<
  | { ok: true; taskId: number; completedWork: number }
  | { ok: false; status: number; body: string }
> {
  const pbiContext = await fetchPbiContext(auth, params.pbiId);
  if (!pbiContext.ok) return pbiContext;

  const assignedTo = await resolveAssignedToValue(auth);
  const pbiUrl = `${adoOrgBase(auth)}/_apis/wit/workitems/${params.pbiId}`;
  const iterationPath = params.sprintPath.trim() || pbiContext.iterationPath;

  const taskStates = await listTaskStates(auth);
  if (taskStates.length === 0) {
    return {
      ok: false,
      status: 422,
      body: "No hay estados disponibles para Task en este proyecto.",
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
    { op: "add", path: `/fields/${resolveWorkingDateFieldName()}`, value: params.workingDate },
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

  return { ok: true, taskId: created.id, completedWork: params.hours };
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
          ? "Permisos insuficientes en este proyecto (se requiere acceso de escritura a work items)."
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
        text: `[TaskPilot] +${params.hours}h — ${commentText}`,
      }),
    }).catch(() => undefined);
  }

  return { ok: true, newCompletedWork };
}

/** True si el método de auth activo está listo para ejecutar en Azure DevOps. */
export async function isAdoExecutionReady(): Promise<boolean> {
  if (isPatAuthMethod()) return isPatConfigured();

  if (!isOAuthAuthMethod() || !isIronSessionConfigured()) return false;

  const session = await getTaskPilotSession();
  return Boolean(
    session.azdoRefreshToken && session.defaultOrg?.trim() && session.defaultProject?.trim(),
  );
}

export type WorkItemSprintFilters = {
  assignee?: string;
  workItemType?: string;
};

type WiqlResponse = {
  workItems?: Array<{ id: number }>;
};

type WorkItemsBatchResponse = {
  value?: Array<{
    id: number;
    fields?: Record<string, string | number | undefined>;
  }>;
};

const TITLE = "System.Title";
const WORK_ITEM_TYPE = "System.WorkItemType";
const STATE = "System.State";
const ASSIGNED_TO = "System.AssignedTo";
const PRIORITY = "Microsoft.VSTS.Common.Priority";
const EFFORT = "Microsoft.VSTS.Scheduling.Effort";
const STORY_POINTS = "Microsoft.VSTS.Scheduling.StoryPoints";
const PARENT = "System.Parent";
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
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && "displayName" in value) {
    const displayName = (value as { displayName?: string }).displayName;
    return typeof displayName === "string" ? displayName.trim() : "";
  }
  return "";
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

  const fields = [
    TITLE,
    WORK_ITEM_TYPE,
    STATE,
    ASSIGNED_TO,
    PRIORITY,
    EFFORT,
    STORY_POINTS,
    PARENT,
    WI_COMPLETED_WORK,
    WI_ORIGINAL_ESTIMATE,
    ...getWorkItemDateFieldNames(),
  ].join(",");
  const chunkSize = 200;
  const items: AdoWorkItemOption[] = [];

  for (let index = 0; index < ids.length; index += chunkSize) {
    const chunk = ids.slice(index, index + chunkSize);
    const url = `${adoProjectBase(auth)}/_apis/wit/workitems?ids=${chunk.join(",")}&fields=${encodeURIComponent(fields)}&api-version=7.1`;
    const res = await adoFetch(auth, url);

    if (!res.ok) {
      const body = await res.text();
      throw new Error(adoListErrorMessage(res, body, "No se pudieron cargar los work items."));
    }

    const data = (await res.json()) as WorkItemsBatchResponse;
    for (const workItem of data.value ?? []) {
      const title = workItem.fields?.[TITLE];
      items.push({
        id: workItem.id,
        title: typeof title === "string" ? title : `Work item ${workItem.id}`,
        type: String(workItem.fields?.[WORK_ITEM_TYPE] ?? "Item"),
        state: String(workItem.fields?.[STATE] ?? ""),
        assignedTo: parseAssignedToField(workItem.fields?.[ASSIGNED_TO]),
        priority: parseNumericField(workItem.fields?.[PRIORITY]),
        effort: parseEffortField(workItem.fields),
        parentId: parseNumericField(workItem.fields?.[PARENT]),
        loggedHours: parseNumericField(workItem.fields?.[WI_COMPLETED_WORK]),
        estimatedHours: parseNumericField(workItem.fields?.[WI_ORIGINAL_ESTIMATE]),
        workingDate: resolveWorkingDateKeyFromFields(workItem.fields),
      });
    }
  }

  return items.sort((a, b) => a.title.localeCompare(b.title, "es"));
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

  if (isWorkItemAssigneeMe(assignee)) {
    conditions.push("[System.AssignedTo] = @Me");
  } else if (!isWorkItemAssigneeAll(assignee)) {
    conditions.push(`[System.AssignedTo] = '${escapeWiqlString(assignee)}'`);
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
      adoListErrorMessage(res, body, "No se pudieron consultar los work items del sprint."),
    );
  }

  const data = (await res.json()) as WiqlResponse;
  const ids = (data.workItems ?? []).map((item) => item.id);
  return fetchWorkItemDetails(auth, ids);
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

type WorkItemFieldPatchOp = {
  op: "add" | "replace";
  path: string;
  value: string | number;
};

function buildWorkingDatePatchOps(
  fields: Record<string, string | number | undefined> | undefined,
  dateValue: string,
): WorkItemFieldPatchOp[] {
  const ops: WorkItemFieldPatchOp[] = [];

  for (const fieldName of getWorkingDateFieldNamesForUpdate()) {
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
    completedWork?: number;
  },
  auth: AdoCallerAuth,
): Promise<UpdateWorkItemStateResult> {
  const state = params.state.trim();
  if (!state) {
    return { ok: false, status: 400, body: "El estado no puede estar vacío." };
  }

  const base = `${adoProjectBase(auth)}/_apis/wit/workitems`;
  const api = "api-version=7.1";
  const headers: Record<string, string> = {
    Authorization: authHeader(auth),
    "Content-Type": "application/json-patch+json",
  };

  const dateFields = [
    SYSTEM_STATE,
    COMPLETED_WORK,
    ...getWorkingDateFieldNamesForUpdate(),
    ...getWorkItemDateFieldNames(),
  ];
  const getFields = [...new Set(dateFields)].join(",");
  const getUrl = `${base}/${params.workItemId}?${api}&$fields=${encodeURIComponent(getFields)}`;
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
    toWorkingDateKey(params.workingDate) ??
    resolveWorkingDateKeyFromFields(wi.fields) ??
    getDefaultWorkingDate();

  const patchOps: WorkItemFieldPatchOp[] = [...buildWorkingDatePatchOps(wi.fields, dateValue)];

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
