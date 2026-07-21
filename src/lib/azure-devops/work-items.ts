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
import {
  buildWiqlIdsQuery,
  filterWorkItemIdsByCondition,
  runWiqlIdsQuery,
} from "@/lib/azure-devops/wiql";
import { resolveWorkingTimeFromFields } from "@/lib/date/ado-datetime";
import {
  buildWorkingDateTimeValue,
  resolveWorkingDateKeyFromFields,
  toWorkingDateKey,
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

/** Tipos de campos que devuelve Azure DevOps en GET workitems. */
type AdoFieldScalarValue = string | number | undefined;
type AdoWorkItemFields = Record<string, AdoFieldScalarValue>;
type AdoFieldsPayload = { fields?: AdoWorkItemFields };
type RawAdoWorkItem = { id: number; fields?: AdoWorkItemFields };

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

type PbiContextResult =
  | { ok: true; areaPath: string; iterationPath: string }
  | { ok: false; status: number; body: string };

async function fetchPbiContext(
  auth: AdoCallerAuth,
  pbiId: number,
): Promise<PbiContextResult> {
  const fields = [AREA_PATH, ITERATION_PATH].join(",");
  const url = `${adoProjectBase(auth)}/_apis/wit/workitems/${pbiId}?fields=${encodeURIComponent(fields)}&api-version=7.1`;
  const res = await adoFetch(auth, url);

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, status: res.status, body: body.slice(0, 500) };
  }

  const data = (await res.json()) as AdoFieldsPayload;
  const areaPath = readStringField(data.fields, AREA_PATH);
  const iterationPath = readStringField(data.fields, ITERATION_PATH);

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
  const taskStates = await listTaskStates(auth, processProfile.taskWorkItemType);
  if (taskStates.length === 0) {
    return createTaskUnavailableStatesFailure();
  }

  const activityFailure = await validateActivity(auth, params.activity);
  if (activityFailure) return activityFailure;

  const createState = pickOpenTaskState(taskStates, processProfile.taskTodoState);
  const assignedTo = await resolveAssignedToValue(auth);

  const ops = buildCreateTaskPatchOps({
    params,
    pbiContext,
    processProfile,
    createState: createState.name,
    pbiId: params.pbiId,
    auth,
    assignedTo,
  });

  const createUrl = `${adoProjectBase(auth)}/_apis/wit/workitems/$${encodeURIComponent(processProfile.taskWorkItemType)}?api-version=7.1`;
  const postResult = await postCreateTaskOps(auth, createUrl, ops, processProfile.workingDateField);
  if (postResult.kind === "error") {
    return {
      ok: false,
      status: postResult.failure.status,
      body: postResult.failure.body,
    };
  }

  const created = (await postResult.response.json()) as { id?: number };
  if (!created.id) return missingCreatedTaskIdFailure();

  if (!params.markAsDone) {
    return {
      ok: true,
      taskId: created.id,
      completedWork: params.hours,
      markedAsDone: false,
    };
  }

  return markCreatedTaskAsDone({
    auth,
    taskId: created.id,
    params,
    taskStates,
    taskDoneState: processProfile.taskDoneState,
  });
}

type AdoTaskState = {
  name: string;
  category: string;
  color: string;
};

function pickOpenTaskState(
  taskStates: ReadonlyArray<AdoTaskState>,
  taskTodoState: string,
): AdoTaskState {
  const createStateName = pickDefaultOpenTaskState(taskStates, taskTodoState || null);
  return (
    taskStates.find((state) => state.name === createStateName) ??
    taskStates.find((state) => state.category === "Proposed") ??
    taskStates[0]
  );
}

async function validateActivity(
  auth: AdoCallerAuth,
  activity: string | undefined,
): Promise<CreateTaskUnderPbiResult | null> {
  if (!activity) return null;
  const allowed = await fetchActivityValues(auth);
  if (allowed.length === 0 || allowed.includes(activity)) return null;
  return {
    ok: false,
    status: 422,
    body: `La actividad "${activity}" no está permitida. Valores válidos: ${allowed.join(", ")}.`,
  };
}

type BuildCreateTaskPatchOpsInput = {
  params: CreateTaskParams;
  auth: AdoCallerAuth;
  pbiContext: { areaPath: string; iterationPath: string };
  processProfile: Awaited<ReturnType<typeof resolveProcessProfile>>;
  createState: string;
  pbiId: number;
  assignedTo: string | null;
};

function buildCreateTaskPatchOps(input: BuildCreateTaskPatchOpsInput): JsonPatchOp[] {
  const { params, auth, pbiContext, processProfile, createState, pbiId, assignedTo } = input;
  const pbiUrl = `${adoOrgBase(auth)}/_apis/wit/workitems/${pbiId}`;
  const iterationPath = params.sprintPath.trim() || pbiContext.iterationPath;

  const ops: JsonPatchOp[] = [
    { op: "add", path: "/fields/System.Title", value: params.title.trim() },
    { op: "add", path: "/fields/System.State", value: createState },
    { op: "add", path: `/fields/${AREA_PATH}`, value: pbiContext.areaPath },
    { op: "add", path: `/fields/${ITERATION_PATH}`, value: iterationPath },
  ];

  pushIfField(ops, processProfile.completedWorkField, params.hours);
  pushIfField(ops, processProfile.originalEstimateField, params.hours);

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
      value: { rel: "System.LinkTypes.Hierarchy-Reverse", url: pbiUrl },
    },
  );

  pushIfField(ops, processProfile.remainingWorkField, 0);
  pushIfField(ops, params.activity ? ADO_FIELD_DEFAULTS.activityField : null, params.activity ?? "");
  pushIfField(
    ops,
    params.description?.trim() ? DESCRIPTION_FIELD : null,
    params.description?.trim() ?? "",
  );
  pushIfField(ops, assignedTo ? ASSIGNED_TO : null, assignedTo ?? "");

  return ops;
}

function pushIfField(ops: JsonPatchOp[], field: string | null, value: string | number): void {
  if (!field) return;
  ops.push({ op: "add", path: `/fields/${field}`, value });
}

type CreateTaskPostResult =
  | { kind: "ok"; response: Response }
  | { kind: "error"; failure: { ok: false; status: number; body: string } };

async function postCreateTaskOps(
  auth: AdoCallerAuth,
  url: string,
  ops: JsonPatchOp[],
  workingDateField: string,
): Promise<CreateTaskPostResult> {
  const firstRes = await adoFetch(auth, url, {
    method: "POST",
    headers: { "Content-Type": "application/json-patch+json" },
    body: JSON.stringify(ops),
  });
  if (firstRes.ok) return { kind: "ok", response: firstRes };

  const errorBody = await firstRes.text();
  const retryOps = pickRetryOpsForCreateTask(errorBody, firstRes.status, ops, workingDateField);
  if (!retryOps) {
    return {
      kind: "error",
      failure: { ok: false, status: firstRes.status, body: errorBody.slice(0, 500) },
    };
  }

  const retryRes = await adoFetch(auth, url, {
    method: "POST",
    headers: { "Content-Type": "application/json-patch+json" },
    body: JSON.stringify(retryOps),
  });
  if (retryRes.ok) return { kind: "ok", response: retryRes };

  const retryErr = await retryRes.text();
  return {
    kind: "error",
    failure: { ok: false, status: retryRes.status, body: retryErr.slice(0, 500) },
  };
}

function pickRetryOpsForCreateTask(
  errorBody: string,
  status: number,
  ops: JsonPatchOp[],
  workingDateField: string,
): JsonPatchOp[] | null {
  if (status !== 400 || !errorBody.includes("TF401320")) return null;
  const workingDatePath = `/fields/${workingDateField}`;
  const hasWorkingDateOp = ops.some(
    (op) => "path" in op && op.path === workingDatePath,
  );
  if (!hasWorkingDateOp) return null;
  return ops.filter((op) => !("path" in op && op.path === workingDatePath));
}

async function markCreatedTaskAsDone(input: {
  auth: AdoCallerAuth;
  taskId: number;
  params: CreateTaskParams;
  taskStates: readonly AdoTaskState[];
  taskDoneState: string;
}): Promise<CreateTaskUnderPbiResult> {
  const { auth, taskId, params, taskStates, taskDoneState } = input;
  const doneState = pickDefaultCompletedTaskState(taskStates, taskDoneState || null);
  const markDoneResult = await updateWorkItemState(
    {
      workItemId: taskId,
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
      body: `La tarea #${taskId} se creó, pero no se pudo marcar como Done: ${markDoneResult.body}`,
    };
  }
  return { ok: true, taskId, completedWork: params.hours, markedAsDone: true };
}

function createTaskUnavailableStatesFailure(): CreateTaskUnderPbiResult {
  return {
    ok: false,
    status: 422,
    body: "No hay estados disponibles para Tarea en este proyecto.",
  };
}

function missingCreatedTaskIdFailure(): CreateTaskUnderPbiResult {
  return {
    ok: false,
    status: 502,
    body: "Azure DevOps no devolvió el ID de la tarea creada.",
  };
}

export type LogWorkOnWorkItemResult =
  | { ok: true; newCompletedWork: number }
  | { ok: false; status: number; body: string };

export async function logWorkOnWorkItem(
  params: { workItemId: number; hours: number; comment: string },
  auth: AdoCallerAuth,
): Promise<LogWorkOnWorkItemResult> {
  const processProfile = await resolveProcessProfile(auth);
  const { completedWorkField } = processProfile;
  if (!completedWorkField) {
    return logWorkMissingCompletedWorkFailure();
  }

  const ctx = buildLogWorkContext(auth, params, completedWorkField);
  const getResult = await fetchWorkItemCompletedWork(ctx);
  if (getResult.kind === "failed") return getResult.failure;

  const currentRaw = getResult.fields?.[completedWorkField];
  const newCompletedWork = computeNewCompletedWork(currentRaw, params.hours);

  const patchResult = await patchCompletedWork({
    ctx,
    completedWorkField,
    newCompletedWork,
    hadField: currentRaw !== undefined && currentRaw !== null,
  });
  if (patchResult.kind === "failed") return patchResult.failure;

  await postLogWorkComment(ctx, params);
  return { ok: true, newCompletedWork };
}

type LogWorkContext = {
  base: string;
  api: string;
  getUrl: string;
  patchUrl: string;
  commentsUrl: string;
  jsonHeaders: Record<string, string>;
  patchHeaders: Record<string, string>;
};

type LogWorkGetResult =
  | { kind: "ok"; fields: Record<string, AdoFieldScalarValue> }
  | { kind: "failed"; failure: LogWorkOnWorkItemResult };

type LogWorkPatchResult = { kind: "ok" } | { kind: "failed"; failure: LogWorkOnWorkItemResult };

function buildLogWorkContext(
  auth: AdoCallerAuth,
  params: { workItemId: number },
  completedWorkField: string,
): LogWorkContext {
  const base = `https://dev.azure.com/${encodeURIComponent(auth.organization)}/${encodeURIComponent(auth.project)}/_apis/wit/workitems`;
  const api = "api-version=7.1";
  const jsonHeaders: Record<string, string> = {
    Authorization: authHeader(auth),
    "Content-Type": "application/json",
  };
  return {
    base,
    api,
    getUrl: `${base}/${params.workItemId}?${api}&$fields=${encodeURIComponent(completedWorkField)}`,
    patchUrl: `${base}/${params.workItemId}?${api}`,
    commentsUrl: `${base}/${params.workItemId}/comments?${api}-preview.3`,
    jsonHeaders,
    patchHeaders: { ...jsonHeaders, "Content-Type": "application/json-patch+json" },
  };
}

async function fetchWorkItemCompletedWork(ctx: LogWorkContext): Promise<LogWorkGetResult> {
  const getRes = await fetch(ctx.getUrl, { headers: ctx.jsonHeaders, cache: "no-store" });
  if (getRes.status === 401 || getRes.status === 403) {
    return { kind: "failed", failure: await mapLogWorkAuthFailure(getRes) };
  }
  if (!getRes.ok) {
    const body = await getRes.text();
    return {
      kind: "failed",
      failure: { ok: false, status: getRes.status, body: body.slice(0, 500) },
    };
  }
  const wi = (await getRes.json()) as AdoFieldsPayload;
  return { kind: "ok", fields: wi.fields ?? {} };
}

async function mapLogWorkAuthFailure(getRes: Response): Promise<LogWorkOnWorkItemResult> {
  const body = await getRes.text();
  if (getRes.status === 403) {
    return {
      ok: false,
      status: 403,
      body: "Permisos insuficientes en este proyecto (se requiere acceso de escritura a elementos de trabajo).",
    };
  }
  return { ok: false, status: getRes.status, body: body.slice(0, 500) };
}

function computeNewCompletedWork(
  currentRaw: AdoFieldScalarValue,
  additionalHours: number,
): number {
  const previous = parseCompletedWorkFieldValue(currentRaw);
  const safePrevious = Number.isFinite(previous) ? previous : 0;
  return Math.round((safePrevious + additionalHours) * 100) / 100;
}

async function patchCompletedWork(input: {
  ctx: LogWorkContext;
  completedWorkField: string;
  newCompletedWork: number;
  hadField: boolean;
}): Promise<LogWorkPatchResult> {
  const body = JSON.stringify([
    {
      op: input.hadField ? "replace" : "add",
      path: `/fields/${input.completedWorkField}`,
      value: input.newCompletedWork,
    },
  ]);
  const res = await fetch(input.ctx.patchUrl, {
    method: "PATCH",
    headers: input.ctx.patchHeaders,
    body,
  });
  if (!res.ok) {
    const errorBody = await res.text();
    return {
      kind: "failed",
      failure: { ok: false, status: res.status, body: errorBody.slice(0, 500) },
    };
  }
  return { kind: "ok" };
}

async function postLogWorkComment(
  ctx: LogWorkContext,
  params: { comment: string; hours: number },
): Promise<void> {
  const trimmed = params.comment.trim();
  if (!trimmed) return;
  await fetch(ctx.commentsUrl, {
    method: "POST",
    headers: ctx.jsonHeaders,
    body: JSON.stringify({ text: `[NeosView] +${params.hours}h — ${trimmed}` }),
  }).catch(() => undefined);
}

function logWorkMissingCompletedWorkFailure(): LogWorkOnWorkItemResult {
  return {
    ok: false,
    status: 422,
    body: "Este proyecto no tiene configurado el campo de trabajo completado (Completed Work).",
  };
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
  /**
   * Si se define, agrega al WIQL `[<campo>] > '0'` para que la query
   * excluya ítems sin horas registradas. Usado por los wrappers de
   * Task/Bug; las queries PBI (e.g. selector de `/time-log`) lo omiten.
   */
  completedWorkField?: string | null;
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
const REPRO_STEPS_FIELD = "Microsoft.VSTS.TCM.ReproSteps";
const ACTIVITY_FIELD = ADO_FIELD_DEFAULTS.activityField;
const REOPENED_WORKING_DATE_FIELD = "Custom.ReOpenedWorkingDate";
const REOPENED_BOOLEAN_FIELD = "Custom.Reopenedboolean";

function isReopenedStateName(state: string): boolean {
  return state.trim().toLowerCase() === "reopened";
}
function parseNumericField(value: AdoFieldScalarValue): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function parseEffortField(fields: AdoWorkItemFields | undefined): number | undefined {
  return (
    parseNumericField(fields?.[EFFORT]) ?? parseNumericField(fields?.[STORY_POINTS])
  );
}

function parseRichTextField(value: AdoFieldScalarValue): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

/** Lee un campo de tipo `string` desde `AdoWorkItemFields`, devolviendo `undefined`
 *  si el valor está ausente o no es string. Centraliza el narrowing que antes
 *  hacíamos inline con `?.trim()` (no compila cuando el campo admite números). */
function readStringField(
  fields: AdoWorkItemFields | undefined,
  referenceName: string,
): string | undefined {
  const value = fields?.[referenceName];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function parseCompletedWorkFieldValue(
  value: AdoFieldScalarValue,
): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

async function fetchWorkItemDetails(
  auth: AdoCallerAuth,
  ids: number[],
): Promise<AdoWorkItemOption[]> {
  if (ids.length === 0) return [];

  const ctx = await resolveWorkItemDetailsContext(auth);
  const items = await fetchWorkItemsInChunks(auth, ids, ctx.requestedFields);
  const mapped = items.map((workItem) => mapWorkItemToOption(workItem, ctx));
  return mapped.sort((a, b) => a.title.localeCompare(b.title, "es"));
}

type WorkItemDetailsContext = {
  responsableFields: Awaited<ReturnType<typeof resolveBacklogResponsableFields>>;
  processProfile: Awaited<ReturnType<typeof resolveProcessProfile>>;
  backlogFetchFields: Awaited<ReturnType<typeof getBacklogItemFetchFieldNames>>;
  requestedFields: readonly string[];
};

async function resolveWorkItemDetailsContext(auth: AdoCallerAuth): Promise<WorkItemDetailsContext> {
  const [responsableFields, processProfile, backlogFetchFields] = await Promise.all([
    resolveBacklogResponsableFields(auth),
    resolveProcessProfile(auth),
    getBacklogItemFetchFieldNames(auth),
  ]);
  return {
    responsableFields,
    processProfile,
    backlogFetchFields,
    requestedFields: buildRequestedFields(processProfile, backlogFetchFields),
  };
}

function buildRequestedFields(
  processProfile: Awaited<ReturnType<typeof resolveProcessProfile>>,
  backlogFetchFields: ReadonlyArray<string>,
): string[] {
  return [
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
    REPRO_STEPS_FIELD,
    ACTIVITY_FIELD,
    ...processProfile.workItemDateFieldNames,
    ...backlogFetchFields,
    ...(processProfile.completedWorkField ? [processProfile.completedWorkField] : []),
    ...(processProfile.originalEstimateField ? [processProfile.originalEstimateField] : []),
  ];
}

async function fetchWorkItemsInChunks(
  auth: AdoCallerAuth,
  ids: readonly number[],
  requestedFields: readonly string[],
): Promise<RawAdoWorkItem[]> {
  const chunkSize = 200;
  const collected: RawAdoWorkItem[] = [];
  for (let index = 0; index < ids.length; index += chunkSize) {
    const chunk = ids.slice(index, index + chunkSize);
    const data = await fetchWorkItemsBatchWithFieldFallback(auth, [...chunk], [...requestedFields]);
    for (const item of data.value ?? []) collected.push(item);
  }
  return collected;
}

function mapWorkItemToOption(
  workItem: RawAdoWorkItem,
  ctx: WorkItemDetailsContext,
): AdoWorkItemOption {
  const { responsableFields, processProfile } = ctx;
  const fields = workItem.fields;
  const title = fields?.[TITLE];
  return {
    id: workItem.id,
    title: typeof title === "string" ? title : `Elemento de trabajo ${workItem.id}`,
    description: parseRichTextField(fields?.[DESCRIPTION_FIELD]),
    acceptanceCriteria: parseRichTextField(fields?.[ACCEPTANCE_CRITERIA_FIELD]),
    reproSteps: parseRichTextField(fields?.[REPRO_STEPS_FIELD]),
    type: String(fields?.[WORK_ITEM_TYPE] ?? "Item"),
    state: String(fields?.[STATE] ?? ""),
    assignedTo: parseIdentityDisplayName(fields?.[ASSIGNED_TO]),
    priority: parseNumericField(fields?.[PRIORITY]),
    effort: parseEffortField(fields),
    parentId: parseNumericField(fields?.[PARENT]),
    loggedHours: parseOptionalNumberField(fields, processProfile.completedWorkField),
    estimatedHours: parseOptionalNumberField(fields, processProfile.originalEstimateField),
    workingDate: resolveWorkingDateKeyFromFields(
      fields,
      processProfile.workItemDateFieldNames,
      processProfile.timezone,
    ),
    workingTime: resolveWorkingTimeFromFields(
      fields,
      processProfile.workingDateField,
      processProfile.timezone,
    ),
    tags: parseAdoWorkItemTags(
      typeof fields?.[SYSTEM_TAGS] === "string" ? fields[SYSTEM_TAGS] : undefined,
    ),
    activity:
      typeof fields?.[ACTIVITY_FIELD] === "string"
        ? (fields[ACTIVITY_FIELD] as string) || undefined
        : undefined,
    ...mapBacklogItemFields(fields, responsableFields),
  };
}

function parseOptionalNumberField(
  fields: AdoWorkItemFields | undefined,
  referenceName: string | null,
): number | undefined {
  if (!referenceName) return undefined;
  return parseNumericField(fields?.[referenceName]);
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
    const taskIds = await fetchSprintTaskIds(auth, iterationPath, assignee, taskWorkItemType);
    if (taskIds.length === 0) return [];

    const parentIds = await collectParentIdsFromTasks(auth, taskIds, existingIds);
    if (parentIds.size === 0) return [];

    const filteredParentIds = await filterParentIdsByAssignee({
      auth,
      assignee,
      parentIds,
      pbiAssigneeField,
    });
    if (filteredParentIds.length === 0) return [];

    const parents = await fetchWorkItemsByIds(auth, filteredParentIds);
    return parents.filter((item) => item.type === backlogType);
  } catch {
    return [];
  }
}

async function fetchSprintTaskIds(
  auth: AdoCallerAuth,
  iterationPath: string,
  assignee: string,
  taskWorkItemType: string,
): Promise<number[]> {
  const project = escapeWiqlString(auth.project);
  const path = escapeWiqlString(iterationPath);
  const conditions = [
    `[System.TeamProject] = '${project}'`,
    `[System.IterationPath] UNDER '${path}'`,
    `[System.State] <> 'Removed'`,
    `[System.WorkItemType] = '${escapeWiqlString(taskWorkItemType)}'`,
  ];
  const assigneeCondition = buildAssigneeWiqlCondition(assignee);
  if (assigneeCondition) conditions.push(assigneeCondition);
  return runWiqlIdsQuery(
    auth,
    buildWiqlIdsQuery(conditions),
    "No se pudieron consultar las tareas del sprint.",
  );
}

async function collectParentIdsFromTasks(
  auth: AdoCallerAuth,
  taskIds: readonly number[],
  existingIds: ReadonlySet<number>,
): Promise<Set<number>> {
  const chunkSize = 200;
  const parentIds = new Set<number>();
  for (let i = 0; i < taskIds.length; i += chunkSize) {
    const chunk = taskIds.slice(i, i + chunkSize);
    const parentData = await fetchWorkItemsBatchWithFieldFallback(auth, chunk, [PARENT]);
    for (const item of parentData.value ?? []) {
      const raw = item.fields?.[PARENT];
      if (isEligibleParentId(raw, existingIds)) parentIds.add(raw);
    }
  }
  return parentIds;
}

function isEligibleParentId(raw: unknown, existingIds: ReadonlySet<number>): raw is number {
  return typeof raw === "number" && Number.isFinite(raw) && !existingIds.has(raw);
}

async function filterParentIdsByAssignee(input: {
  auth: AdoCallerAuth;
  assignee: string;
  parentIds: ReadonlySet<number>;
  pbiAssigneeField?: string;
}): Promise<number[]> {
  const assigneeCondition = input.pbiAssigneeField
    ? buildFieldAssigneeWiqlCondition(input.pbiAssigneeField, input.assignee)
    : buildAssigneeWiqlCondition(input.assignee);
  if (!assigneeCondition) return [...input.parentIds];
  return filterWorkItemIdsByCondition(
    input.auth,
    [...input.parentIds],
    assigneeCondition,
    "No se pudieron filtrar las historias por responsable.",
  );
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

  // Excluir ítems sin horas registradas para que solo cuenten los que
  // aportaron tiempo. PBIs (queries del /time-log) nunca pasan este
  // campo, así que la condición se omite y su WIQL queda intacto.
  if (filters.completedWorkField) {
    conditions.push(`[${filters.completedWorkField}] > '0'`);
  }

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

  const ids = await runWiqlIdsQuery(
    auth,
    buildWiqlIdsQuery(conditions, "[System.ChangedDate] DESC"),
    "No se pudieron consultar los elementos de trabajo del sprint.",
  );
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
    completedWorkField: processProfile.completedWorkField,
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
  fields: AdoWorkItemFields | undefined,
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
  fields: AdoWorkItemFields | undefined,
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

type UpdateStateBuildPatchOpsInput = {
  fields: AdoWorkItemFields | undefined;
  params: {
    workingDate?: string;
    workingTime?: string;
    completedWork?: number;
    title?: string;
    description?: string;
    activity?: string;
    reopenedDate?: string;
  };
  state: string;
  processProfile: Awaited<ReturnType<typeof resolveProcessProfile>>;
  workingDateFieldNamesForUpdate: string[];
};

function buildUpdateStatePatchOps({
  fields,
  params,
  state,
  processProfile,
  workingDateFieldNamesForUpdate,
}: UpdateStateBuildPatchOpsInput): WorkItemFieldPatchOp[] {
  const patchOps: WorkItemFieldPatchOp[] = [];

  if (params.workingDate) {
    patchOps.push(
      ...buildWorkingDatePatchOps(
        fields,
        params.workingDate,
        params.workingTime ?? "12:00",
        processProfile.timezone,
        workingDateFieldNamesForUpdate,
      ),
    );
  }

  if (
    params.completedWork !== undefined &&
    Number.isFinite(params.completedWork) &&
    processProfile.completedWorkField
  ) {
    patchOps.push(
      ...buildCompletedWorkPatchOps(fields, params.completedWork, processProfile.completedWorkField),
    );
  }

  if (params.title) {
    patchOps.push({ op: "replace", path: `/fields/${TITLE}`, value: params.title.trim() });
  }

  if (params.description !== undefined) {
    patchOps.push({
      op: "replace",
      path: `/fields/${DESCRIPTION_FIELD}`,
      value: params.description,
    });
  }

  if (params.activity) {
    patchOps.push({
      op: "replace",
      path: `/fields/${ACTIVITY_FIELD}`,
      value: params.activity.trim(),
    });
  }

  if (isReopenedStateName(state)) {
    const reopenedDate = params.reopenedDate ? toWorkingDateKey(params.reopenedDate) : null;
    if (reopenedDate) {
      patchOps.push({
        op: "replace",
        path: `/fields/${REOPENED_WORKING_DATE_FIELD}`,
        value: reopenedDate,
      });
    }
    // Custom.Reopenedboolean es integer-typed (default "0" en el proceso).
    patchOps.push({
      op: "replace",
      path: `/fields/${REOPENED_BOOLEAN_FIELD}`,
      value: 1,
    });
  }

  patchOps.push({ op: "replace", path: `/fields/${SYSTEM_STATE}`, value: state });
  return patchOps;
}

type RetryPatchInput = {
  auth: AdoCallerAuth;
  patchRes: Response;
  patchOps: WorkItemFieldPatchOp[];
  patchUrl: string;
  headers: Record<string, string>;
  workingDateFieldNamesForUpdate: string[];
  state: string;
  workingDate: string | null;
};

/**
 * Maneja los reintentos del PATCH de estado cuando ADO rechaza la transición
 * por reglas de campos personalizados (Working Date requerido, conflictos de
 * recursos, o campos de fecha marcados como read-only). Si no aplica ningún
 * reintento, devuelve el error original.
 */
async function retryPatchOnAdoError(input: RetryPatchInput): Promise<UpdateWorkItemStateResult> {
  const body = await input.patchRes.text();
  const detection = detectRetryableAdoError(body, input.workingDate, input.patchRes.status);
  if (!input.workingDate || !detection) return formatUpdateStateFailure(input.patchRes, body);

  if (detection.kind === "missing-date-field") {
    return retryWithAddedMissingDateFields({
      auth: input.auth,
      patchOps: input.patchOps,
      patchUrl: input.patchUrl,
      headers: input.headers,
      workingDate: input.workingDate,
      body,
      state: input.state,
    });
  }

  if (detection.kind === "read-only-working-date") {
    return retryWithoutReadOnlyWorkingDate({
      auth: input.auth,
      patchOps: input.patchOps,
      patchUrl: input.patchUrl,
      headers: input.headers,
      workingDateFieldNamesForUpdate: input.workingDateFieldNamesForUpdate,
      state: input.state,
    });
  }

  return formatUpdateStateFailure(input.patchRes, body);
}

type RetryDetection =
  | { kind: "missing-date-field" }
  | { kind: "read-only-working-date" }
  | null;

function detectRetryableAdoError(
  body: string,
  workingDate: string | null,
  status: number,
): RetryDetection {
  if (status !== 400 || !workingDate) return null;

  const isRuleError = body.includes("TF401320");
  const mentionsRequiredDate =
    /(working date|fecha\s+de\s+trabajo|workingdate)/i.test(body) &&
    /required|is required|requerid/i.test(body);
  const isResourceConflict = body.includes("TF400813") || body.includes("TF50027");
  const isReadOnlyWorkingDate =
    isRuleError && /(readonly|invalidnotoldvalue)/i.test(body);

  if (isReadOnlyWorkingDate) return { kind: "read-only-working-date" };
  if (isRuleError || mentionsRequiredDate || isResourceConflict) {
    return { kind: "missing-date-field" };
  }
  return null;
}

async function retryWithAddedMissingDateFields(input: {
  auth: AdoCallerAuth;
  patchOps: WorkItemFieldPatchOp[];
  patchUrl: string;
  headers: Record<string, string>;
  workingDate: string;
  body: string;
  state: string;
}): Promise<UpdateWorkItemStateResult> {
  const requiredFields = parseRequiredEmptyFieldsFromAdoError(input.body);
  const patchedPaths = new Set(input.patchOps.map((op) => op.path));
  const missingDateFields = requiredFields.filter(
    (f) => !patchedPaths.has(`/fields/${f}`) && looksLikeDateField(f),
  );
  if (missingDateFields.length === 0) {
    return formatGenericUpdateStateFailure(input.body);
  }

  const retryOps: WorkItemFieldPatchOp[] = [
    ...input.patchOps,
    ...missingDateFields.map((f): WorkItemFieldPatchOp => ({
      op: "add",
      path: `/fields/${f}`,
      value: input.workingDate,
    })),
  ];

  return executePatchRetry(input, retryOps);
}

async function retryWithoutReadOnlyWorkingDate(input: {
  auth: AdoCallerAuth;
  patchOps: WorkItemFieldPatchOp[];
  patchUrl: string;
  headers: Record<string, string>;
  workingDateFieldNamesForUpdate: string[];
  state: string;
}): Promise<UpdateWorkItemStateResult> {
  const workingDatePaths = new Set(
    input.workingDateFieldNamesForUpdate.map((f) => `/fields/${f}`),
  );
  const retryOps = input.patchOps.filter((op) => !workingDatePaths.has(op.path));
  if (retryOps.length >= input.patchOps.length) {
    return { ok: true, state: input.state };
  }
  return executePatchRetry(input, retryOps);
}

async function executePatchRetry(
  input: {
    auth: AdoCallerAuth;
    patchUrl: string;
    headers: Record<string, string>;
    state: string;
  },
  retryOps: WorkItemFieldPatchOp[],
): Promise<UpdateWorkItemStateResult> {
  const retryRes = await adoFetch(input.auth, input.patchUrl, {
    method: "PATCH",
    headers: input.headers,
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
  return { ok: true, state: input.state };
}

function formatUpdateStateFailure(
  patchRes: Response,
  body: string,
): UpdateWorkItemStateResult {
  return {
    ok: false,
    status: patchRes.status,
    body: body.slice(0, 500) || "No se pudo actualizar el estado del work item.",
  };
}

function formatGenericUpdateStateFailure(body: string): UpdateWorkItemStateResult {
  return {
    ok: false,
    status: 400,
    body: body.slice(0, 500) || "No se pudo actualizar el estado del work item.",
  };
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
    fields?: AdoWorkItemFields;
  };

  const patchOps = buildUpdateStatePatchOps({
    fields: wi.fields,
    params,
    state,
    processProfile,
    workingDateFieldNamesForUpdate,
  });

  const patchUrl = `${base}/${params.workItemId}?${api}`;
  const patchRes = await adoFetch(auth, patchUrl, {
    method: "PATCH",
    headers,
    body: JSON.stringify(patchOps),
  });

  if (!patchRes.ok) {
    return retryPatchOnAdoError({
      auth,
      patchRes,
      patchOps,
      patchUrl,
      headers,
      workingDateFieldNamesForUpdate,
      state,
      workingDate: params.workingDate ?? null,
    });
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
