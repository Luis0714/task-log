import { isOAuthAuthMethod, isPatAuthMethod } from "@/lib/auth/auth-method";
import { adoFetch, adoOrgBase, adoProjectBase, adoAuthHeader } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { isPatConfigured } from "@/lib/azure-devops/resolve-auth";
import { resolveAdoProfile } from "@/lib/auth/resolve-ado-profile";
import { isIronSessionConfigured } from "@/lib/auth/session";
import { getTaskPilotSession } from "@/lib/auth/session";
import type { TaskActivity } from "@/lib/time-log/task-constants";
import { listTaskStates } from "@/lib/azure-devops/work-item-type-states";
import {
  isCompletedTaskStateCategory,
  pickDefaultOpenTaskState,
  resolveTargetTaskState,
} from "@/lib/time-log/task-state-utils";

function authHeader(auth: AdoCallerAuth): string {
  return adoAuthHeader(auth);
}

const COMPLETED_WORK = "Microsoft.VSTS.Scheduling.CompletedWork";
const REMAINING_WORK = "Microsoft.VSTS.Scheduling.RemainingWork";
const ORIGINAL_ESTIMATE = "Microsoft.VSTS.Scheduling.OriginalEstimate";
const ACTIVITY = "Microsoft.VSTS.Common.Activity";
const AREA_PATH = "System.AreaPath";
const ITERATION_PATH = "System.IterationPath";

function workingDateField(): string {
  return (
    process.env.AZDO_WORKING_DATE_FIELD?.trim() || "Microsoft.VSTS.Scheduling.StartDate"
  );
}

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

  const targetState = resolveTargetTaskState(taskStates, params.state);
  if (!targetState) {
    return {
      ok: false,
      status: 422,
      body: `El estado "${params.state}" no es válido para Task en este proyecto.`,
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
    { op: "add", path: `/fields/${workingDateField()}`, value: params.workingDate },
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

  if (createState.name !== targetState.name) {
    const transitionOps: Array<{ op: "replace" | "add"; path: string; value: string | number }> = [
      { op: "replace", path: "/fields/System.State", value: targetState.name },
    ];

    if (isCompletedTaskStateCategory(targetState.category)) {
      transitionOps.push({ op: "replace", path: `/fields/${REMAINING_WORK}`, value: 0 });
    }

    const transition = await patchWorkItemFields(auth, created.id, transitionOps);
    if (!transition.ok) {
      return {
        ok: false,
        status: transition.status,
        body: `La tarea #${created.id} se creó, pero no se pudo aplicar el estado "${targetState.name}": ${transition.body}`,
      };
    }
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
