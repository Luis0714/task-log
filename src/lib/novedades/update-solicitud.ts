import "server-only";

import { adoFetch, adoOrgBase, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import {
  COMPLETED_WORK_FIELD,
  NOVEDAD_FIELDS,
  resolveTiempoNovedadFieldRef,
} from "@/lib/azure-devops/novedad-fields";
import { buildWorkingDateTimeValue } from "@/lib/azure-devops/working-date-field";
import {
  assertSolicitudContext,
  mapAdoFailureToSolicitud,
  resolveAssigneeFromRoster,
  resolveSolicitudTiming,
} from "@/lib/novedades/solicitud-context";
import type { SolicitudMutationResult } from "@/lib/novedades/news-story-link";
import { SOLICITUD_ERROR_CODES } from "@/lib/solicitudes/error-codes";
import type { CreateSolicitudBody } from "@/lib/schemas/solicitudes";

/**
 * Edita una novedad existente en Azure DevOps. Valida pertenencia al
 * proyecto/equipo y que la HU destino siga vinculada (paridad con la
 * creación). Conserva state/área/iteración de la HU actual para no mover el
 * ítem de contexto.
 */
export type UpdateSolicitudResult = SolicitudMutationResult;

/** Valor de un campo de work item de ADO. */
type FieldValue = string | number | undefined;

async function fetchCurrentFields(
  auth: AdoCallerAuth,
  workItemId: number,
): Promise<Record<string, FieldValue> | null> {
  const url = `${adoProjectBase(auth)}/_apis/wit/workitems/${workItemId}?api-version=7.1`;
  const res = await adoFetch(auth, url);
  if (!res.ok) return null;
  const data = (await res.json()) as { fields?: Record<string, FieldValue> };
  return data.fields ?? {};
}

function patchOp(
  hadValue: boolean,
  path: string,
  value: string | number,
): { op: "add" | "replace"; path: string; value: string | number } {
  return { op: hadValue ? "replace" : "add", path, value };
}

type PatchOp =
  | { op: "add" | "replace"; path: string; value: string | number }
  | { op: "add" | "replace"; path: string; value: { rel: string; url: string } };

/** Op de estado solo si el cliente pide uno distinto al actual. */
function buildStatePatchOp(
  requestedStateRaw: string | undefined,
  currentFields: Record<string, FieldValue>,
): PatchOp | null {
  const requestedState = requestedStateRaw?.trim() ?? "";
  if (!requestedState) return null;
  const currentState =
    typeof currentFields[NOVEDAD_FIELDS.state] === "string"
      ? (currentFields[NOVEDAD_FIELDS.state] as string).trim()
      : "";
  if (requestedState === currentState) return null;
  return patchOp(
    Boolean(currentState),
    `/fields/${NOVEDAD_FIELDS.state}`,
    requestedState,
  );
}

type ParentRelationResult =
  | { ok: true; op: PatchOp | null }
  | { ok: false; status: number; message: string };

/** Resuelve el op de relación padre (cambio de HU) o null si no cambia. */
async function resolveParentRelationOp(
  auth: AdoCallerAuth,
  workItemId: number,
  currentFields: Record<string, FieldValue>,
  newsStoryId: number,
): Promise<ParentRelationResult> {
  const currentParentId =
    typeof currentFields["System.Parent"] === "number"
      ? (currentFields["System.Parent"] as number)
      : null;
  if (currentParentId === newsStoryId) return { ok: true, op: null };

  const relationsUrl = `${adoProjectBase(auth)}/_apis/wit/workitems/${workItemId}?$expand=relations&api-version=7.1`;
  const relationsRes = await adoFetch(auth, relationsUrl);
  if (!relationsRes.ok) {
    return {
      ok: false,
      status: 502,
      message: "No se pudo leer la relación padre de la novedad.",
    };
  }
  const relationsBody = (await relationsRes.json()) as {
    relations?: Array<{ rel: string }>;
  };
  const parentIndex = (relationsBody.relations ?? []).findIndex(
    (relation) => relation.rel === "System.LinkTypes.Hierarchy-Reverse",
  );
  const parentUrl = `${adoOrgBase(auth)}/_apis/wit/workitems/${newsStoryId}`;
  const value = { rel: "System.LinkTypes.Hierarchy-Reverse", url: parentUrl };
  return {
    ok: true,
    op:
      parentIndex >= 0
        ? { op: "replace", path: `/relations/${parentIndex}`, value }
        : { op: "add", path: "/relations/-", value },
  };
}

export async function updateSolicitud(
  auth: AdoCallerAuth,
  workItemId: number,
  body: CreateSolicitudBody,
): Promise<UpdateSolicitudResult> {
  const context = await assertSolicitudContext(auth, body);
  if (!context.ok) return context;

  const currentFields = await fetchCurrentFields(auth, workItemId);
  if (!currentFields) {
    return {
      ok: false,
      status: 502,
      message: "No se pudo leer la novedad antes de actualizarla.",
    };
  }

  const resolvedAssignee = await resolveAssigneeFromRoster(
    auth,
    context.members,
    body.assignedTo,
  );
  if (!resolvedAssignee) {
    return { ok: false, status: 400, message: SOLICITUD_ERROR_CODES.assigneeNotMember };
  }

  const { hours, timeZone, fechaReintegro } = resolveSolicitudTiming(body);
  const tiempoFieldRef = await resolveTiempoNovedadFieldRef(auth);

  const ops: PatchOp[] = [];

  // Estado: solo parchear si el cliente envía uno distinto al actual. Sin
  // esto, ADO no permite PATCH sobre `System.State` para usuarios sin
  // permisos de transición y devolvería 400.
  const stateOp = buildStatePatchOp(body.state, currentFields);
  if (stateOp) ops.push(stateOp);

  ops.push(
    patchOp(
      Boolean(currentFields[NOVEDAD_FIELDS.title]),
      `/fields/${NOVEDAD_FIELDS.title}`,
      body.title.trim(),
    ),
    patchOp(
      Boolean(currentFields[NOVEDAD_FIELDS.assignedTo]),
      `/fields/${NOVEDAD_FIELDS.assignedTo}`,
      resolvedAssignee,
    ),
    patchOp(
      Boolean(currentFields[NOVEDAD_FIELDS.tipo]),
      `/fields/${NOVEDAD_FIELDS.tipo}`,
      body.tipo.trim(),
    ),
    patchOp(
      Boolean(currentFields[NOVEDAD_FIELDS.fechaInicio]),
      `/fields/${NOVEDAD_FIELDS.fechaInicio}`,
      buildWorkingDateTimeValue(body.startDate, body.startTime, timeZone),
    ),
    patchOp(
      Boolean(currentFields[NOVEDAD_FIELDS.fechaFin]),
      `/fields/${NOVEDAD_FIELDS.fechaFin}`,
      buildWorkingDateTimeValue(body.endDate, body.endTime, timeZone),
    ),
    patchOp(
      Boolean(currentFields[NOVEDAD_FIELDS.fechaReintegro]),
      `/fields/${NOVEDAD_FIELDS.fechaReintegro}`,
      fechaReintegro,
    ),
    patchOp(
      Boolean(currentFields[tiempoFieldRef]),
      `/fields/${tiempoFieldRef}`,
      hours,
    ),
  );

  // Espejo en Completed Work cuando "Tiempo Novedad" es un campo distinto.
  if (tiempoFieldRef !== COMPLETED_WORK_FIELD) {
    ops.push(
      patchOp(
        Boolean(currentFields[COMPLETED_WORK_FIELD]),
        `/fields/${COMPLETED_WORK_FIELD}`,
        hours,
      ),
    );
  }

  const description = body.description?.trim() ?? "";
  ops.push(
    patchOp(
      Boolean(currentFields[NOVEDAD_FIELDS.description]),
      `/fields/${NOVEDAD_FIELDS.description}`,
      description,
    ),
  );

  // Cambio de HU padre: parchear la relación existente o agregar una nueva.
  const parentRelation = await resolveParentRelationOp(
    auth,
    workItemId,
    currentFields,
    body.newsStoryId,
  );
  if (!parentRelation.ok) {
    return {
      ok: false,
      status: parentRelation.status,
      message: parentRelation.message,
    };
  }
  if (parentRelation.op) ops.push(parentRelation.op);

  const url = `${adoProjectBase(auth)}/_apis/wit/workitems/${workItemId}?api-version=7.1`;
  const res = await adoFetch(auth, url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json-patch+json" },
    body: JSON.stringify(ops),
  });

  if (!res.ok) {
    const failure = await res.text();
    return mapAdoFailureToSolicitud(res.status, failure.slice(0, 500));
  }

  return {
    ok: true,
    workItemId,
    url: `${adoProjectBase(auth)}/_workitems/edit/${workItemId}`,
  };
}
