import "server-only";

import { resolveAdoProfile } from "@/lib/auth/resolve-ado-profile";
import { formatIdentityPatchValue } from "@/lib/azure-devops/identity-field";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import {
  buildWorkingDateTimeValue,
  resolveAdoTimeZone,
} from "@/lib/azure-devops/working-date-field";
import { loadProjectRoster, type ProjectRosterMember } from "@/lib/filters/load-project-roster";
import { isNewsStoryLinked, type SolicitudMutationResult } from "@/lib/novedades/news-story-link";
import { SOLICITUD_ERROR_CODES } from "@/lib/solicitudes/error-codes";
import { resolveAzureHours } from "@/lib/solicitudes/time-calc";
import type { CreateSolicitudBody } from "@/lib/schemas/solicitudes";

/**
 * Helpers compartidos por `createSolicitud` y `updateSolicitud`. Aíslan la
 * validación del contexto (HU vinculada + roster del proyecto), el cálculo de
 * horas/zona/fecha de reintegro y la traducción de errores de Azure a la forma
 * `SolicitudMutationResult` para que las rutas solo orquesten el flujo de su
 * operación sin repetir lógica.
 */

export type SolicitudContextOk = Readonly<{
  ok: true;
  members: readonly ProjectRosterMember[];
}>;

export type SolicitudContextResult =
  | SolicitudContextOk
  | Extract<SolicitudMutationResult, { ok: false }>;

/**
 * Valida que la HU siga vinculada al proyecto/equipo y devuelve el roster
 * listo para que el caller aplique su estrategia de matching de persona
 * (`findAssigneeByUniqueName` en create, `resolveAssigneeFromRoster` en
 * update). NO falla por assignee inválido: la creación es estricta
 * (uniqueName exacto) y la edición es laxa (displayName case-insensitive +
 * fallback al profile).
 */
export async function assertSolicitudContext(
  auth: AdoCallerAuth,
  body: CreateSolicitudBody,
): Promise<SolicitudContextResult> {
  const team = body.team?.trim() || null;
  if (!(await isNewsStoryLinked(auth.project, team, body.newsStoryId))) {
    return { ok: false, status: 400, message: SOLICITUD_ERROR_CODES.newsStoryNotLinked };
  }
  const members = await loadProjectRoster(auth);
  return { ok: true, members };
}

export type SolicitudTiming = Readonly<{
  hours: number;
  timeZone: string;
  /** DateTime ADO (`Custom.FechaReintegro`) listo para PATCH. */
  fechaReintegro: string;
}>;

/**
 * Cálculos idénticos en create y update: horas redondeadas a 2 decimales,
 * zona horaria del proyecto y reintegro como DateTime ADO.
 */
export function resolveSolicitudTiming(body: CreateSolicitudBody): SolicitudTiming {
  const hours = resolveAzureHours(body.value, body.unit);
  const timeZone = resolveAdoTimeZone();
  const fechaReintegro = buildWorkingDateTimeValue(
    body.fechaReintegro,
    body.reintegroTime,
    timeZone,
  );
  return { hours, timeZone, fechaReintegro };
}

/** Match estricto por `uniqueName`. Es la estrategia de `createSolicitud`. */
export function findAssigneeByUniqueName(
  members: readonly ProjectRosterMember[],
  identifier: string,
): ProjectRosterMember | null {
  return members.find((member) => member.uniqueName === identifier) ?? null;
}

/**
 * Versión laxa para `updateSolicitud`: match por `displayName` o `uniqueName`
 * (case-insensitive, espacios ignorados) con fallback al displayName del
 * usuario logueado (mismo "asignarme" que la creación). Devuelve un string
 * listo para `System.AssignedTo` (formato `"Nombre <unique@…>"`).
 */
export async function resolveAssigneeFromRoster(
  auth: AdoCallerAuth,
  members: readonly ProjectRosterMember[],
  identifier: string,
): Promise<string> {
  const trimmed = identifier.trim();
  const lowered = trimmed.toLowerCase();
  const match = members.find(
    (member) =>
      member.displayName.trim().toLowerCase() === lowered ||
      member.uniqueName.toLowerCase() === lowered,
  );
  if (match) {
    return formatIdentityPatchValue(match.displayName, match.uniqueName);
  }
  const profile = await resolveAdoProfile(auth).catch(() => null);
  if (profile?.displayName?.trim()?.toLowerCase() === lowered) {
    return formatIdentityPatchValue(profile.displayName.trim());
  }
  return formatIdentityPatchValue(trimmed);
}

/**
 * Mapea un fallo de Azure DevOps a `SolicitudMutationResult`. Conserva 403
 * (permisos del caller) y degrada el resto a 502 (fallo aguas arriba). El
 * caller es responsable de truncar el mensaje si viene de `adoFetch.text()`.
 */
export function mapAdoFailureToSolicitud(
  status: number,
  message: string,
): Extract<SolicitudMutationResult, { ok: false }> {
  return {
    ok: false,
    status: status === 403 ? 403 : 502,
    message,
  };
}
