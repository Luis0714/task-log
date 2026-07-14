import "server-only";

import { adoFetch, adoOrgBase, adoProjectBase } from "@/lib/azure-devops/client";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { resolveAdoProfile } from "@/lib/auth/resolve-ado-profile";
import { formatIdentityPatchValue } from "@/lib/azure-devops/identity-field";
import { getRepositories } from "@/lib/db";
import { loadProjectRoster } from "@/lib/filters/load-project-roster";
import { resolveAzureHours } from "@/lib/solicitudes/time-calc";
import { SOLICITUD_ERROR_CODES } from "@/lib/solicitudes/error-codes";
import type { UpdateSolicitudBody } from "@/lib/schemas/solicitudes";
import {
  COMPLETED_WORK_FIELD,
  NOVEDAD_FIELDS,
  resolveTiempoNovedadFieldRef,
} from "@/lib/azure-devops/novedad-fields";
import {
  buildWorkingDateTimeValue,
  resolveAdoTimeZone,
} from "@/lib/azure-devops/working-date-field";

/**
 * Edita una novedad existente en Azure DevOps. Valida pertenencia al
 * proyecto/equipo y que la HU destino siga vinculada (paridad con la
 * creación). Conserva state/área/iteración de la HU actual para no mover el
 * ítem de contexto.
 */
export type UpdateSolicitudResult =
  | { ok: true; workItemId: number; url: string }
  | { ok: false; status: number; message: string };

async function isNewsStoryLinked(
  projectId: string,
  teamId: string | null,
  workItemId: number,
): Promise<boolean> {
  const rows = await getRepositories().newsStories.list({
    projectIds: [projectId],
    teamIds: teamId ? [teamId] : undefined,
  });
  return rows.some((row) => row.workItemId === workItemId);
}

async function resolveAssignee(
  auth: AdoCallerAuth,
  assignedTo: string,
): Promise<string> {
  const members = await loadProjectRoster(auth);
  const match = members.find(
    (member) =>
      member.displayName.trim().toLowerCase() === assignedTo.trim().toLowerCase() ||
      member.uniqueName.toLowerCase() === assignedTo.trim().toLowerCase(),
  );
  if (match) {
    return formatIdentityPatchValue(match.displayName, match.uniqueName);
  }
  // Mismo fallback "asignarme" que la creación: aceptar el displayName del
  // usuario logueado aunque no aparezca en el roster.
  const profile = await resolveAdoProfile(auth).catch(() => null);
  const profileName = profile?.displayName?.trim();
  if (profileName && profileName.toLowerCase() === assignedTo.trim().toLowerCase()) {
    return formatIdentityPatchValue(profileName);
  }
  return formatIdentityPatchValue(assignedTo.trim());
}

async function fetchCurrentFields(
  auth: AdoCallerAuth,
  workItemId: number,
): Promise<Record<string, string | number | undefined> | null> {
  const url = `${adoProjectBase(auth)}/_apis/wit/workitems/${workItemId}?api-version=7.1`;
  const res = await adoFetch(auth, url);
  if (!res.ok) return null;
  const data = (await res.json()) as { fields?: Record<string, string | number | undefined> };
  return data.fields ?? {};
}

function patchOp(
  hadValue: boolean,
  path: string,
  value: string | number,
): { op: "add" | "replace"; path: string; value: string | number } {
  return { op: hadValue ? "replace" : "add", path, value };
}

export async function updateSolicitud(
  auth: AdoCallerAuth,
  workItemId: number,
  body: UpdateSolicitudBody,
): Promise<UpdateSolicitudResult> {
  const team = body.team?.trim() || null;
  if (!(await isNewsStoryLinked(auth.project, team, body.newsStoryId))) {
    return { ok: false, status: 400, message: SOLICITUD_ERROR_CODES.newsStoryNotLinked };
  }

  const currentFields = await fetchCurrentFields(auth, workItemId);
  if (!currentFields) {
    return {
      ok: false,
      status: 502,
      message: "No se pudo leer la novedad antes de actualizarla.",
    };
  }

  const resolvedAssignee = await resolveAssignee(auth, body.assignedTo);
  if (!resolvedAssignee) {
    return { ok: false, status: 400, message: SOLICITUD_ERROR_CODES.assigneeNotMember };
  }

  const hours = resolveAzureHours(body.value, body.unit);
  const timeZone = resolveAdoTimeZone();
  const tiempoFieldRef = await resolveTiempoNovedadFieldRef(auth);

  const ops: Array<
    | { op: "add" | "replace"; path: string; value: string | number }
    | { op: "add" | "replace"; path: string; value: { rel: string; url: string } }
  > = [];

  // Estado: solo parchear si el cliente envía uno distinto al actual. Sin
  // esto, ADO no permite PATCH sobre `System.State` para usuarios sin
  // permisos de transición y devolvería 400.
  const requestedState = body.state?.trim() ?? "";
  if (requestedState) {
    const currentState =
      typeof currentFields[NOVEDAD_FIELDS.state] === "string"
        ? (currentFields[NOVEDAD_FIELDS.state] as string).trim()
        : "";
    if (requestedState !== currentState) {
      ops.push(
        patchOp(
          Boolean(currentState),
          `/fields/${NOVEDAD_FIELDS.state}`,
          requestedState,
        ),
      );
    }
  }

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
      buildWorkingDateTimeValue(body.fechaReintegro, body.reintegroTime, timeZone),
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
  const currentParentId =
    typeof currentFields["System.Parent"] === "number"
      ? (currentFields["System.Parent"] as number)
      : null;
  if (currentParentId !== body.newsStoryId) {
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
    const parentUrl = `${adoOrgBase(auth)}/_apis/wit/workitems/${body.newsStoryId}`;
    if (parentIndex >= 0) {
      ops.push({
        op: "replace",
        path: `/relations/${parentIndex}`,
        value: { rel: "System.LinkTypes.Hierarchy-Reverse", url: parentUrl },
      });
    } else {
      ops.push({
        op: "add",
        path: "/relations/-",
        value: { rel: "System.LinkTypes.Hierarchy-Reverse", url: parentUrl },
      });
    }
  }

  const url = `${adoProjectBase(auth)}/_apis/wit/workitems/${workItemId}?api-version=7.1`;
  const res = await adoFetch(auth, url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json-patch+json" },
    body: JSON.stringify(ops),
  });

  if (!res.ok) {
    const body = await res.text();
    const status = res.status === 403 ? 403 : 502;
    return { ok: false, status, message: body.slice(0, 500) };
  }

  return {
    ok: true,
    workItemId,
    url: `${adoProjectBase(auth)}/_workitems/edit/${workItemId}`,
  };
}
