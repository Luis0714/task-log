import "server-only";

import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import { createNovedadUnderStory } from "@/lib/azure-devops/create-novedad";
import { getRepositories } from "@/lib/db";
import { loadProjectRoster } from "@/lib/filters/load-project-roster";
import { resolveAzureHours } from "@/lib/solicitudes/time-calc";
import { SOLICITUD_ERROR_CODES } from "@/lib/solicitudes/error-codes";
import type { CreateSolicitudBody } from "@/lib/schemas/solicitudes";
import {
  buildWorkingDateTimeValue,
  resolveAdoTimeZone,
} from "@/lib/azure-devops/working-date-field";

/**
 * Valida la membresía del proyecto y la HU destino, convierte el tiempo a horas
 * (CA-21) y crea la novedad en Azure (CA-28). Sin reintentos ni idempotencia.
 */
export type CreateSolicitudResult =
  | { ok: true; workItemId: number; url: string }
  | { ok: false; status: number; message: string };

async function isNewsStoryLinked(
  projectId: string,
  teamId: string | null,
  workItemId: number,
): Promise<boolean> {
  // Con equipo, el repo incluye también las HUs a nivel proyecto (teamId nulo),
  // que aplican a todos los equipos.
  const rows = await getRepositories().newsStories.list({
    projectIds: [projectId],
    teamIds: teamId ? [teamId] : undefined,
  });
  return rows.some((row) => row.workItemId === workItemId);
}

export async function createSolicitud(
  auth: AdoCallerAuth,
  body: CreateSolicitudBody,
): Promise<CreateSolicitudResult> {
  const team = body.team?.trim() || null;
  if (!(await isNewsStoryLinked(auth.project, team, body.newsStoryId))) {
    return { ok: false, status: 400, message: SOLICITUD_ERROR_CODES.newsStoryNotLinked };
  }

  const members = await loadProjectRoster(auth);
  const assignee = members.find((member) => member.uniqueName === body.assignedTo);
  if (!assignee) {
    return { ok: false, status: 400, message: SOLICITUD_ERROR_CODES.assigneeNotMember };
  }

  const hours = resolveAzureHours(body.value, body.unit);
  const timeZone = resolveAdoTimeZone();

  const result = await createNovedadUnderStory(
    {
      storyId: body.newsStoryId,
      title: body.title,
      assignedTo: assignee.uniqueName,
      description: body.description,
      tipo: body.tipo,
      startDate: body.startDate,
      startTime: body.startTime,
      endDate: body.endDate,
      endTime: body.endTime,
      fechaReintegro: buildWorkingDateTimeValue(
        body.fechaReintegro,
        body.reintegroTime,
        timeZone,
      ),
      hours,
    },
    auth,
  );

  if (!result.ok) {
    // Errores de Azure diferenciables: 403 permisos; el resto se reporta como
    // 502 (fallo aguas arriba en Azure DevOps).
    const status = result.status === 403 ? 403 : 502;
    return { ok: false, status, message: result.body };
  }

  return { ok: true, workItemId: result.workItemId, url: result.url };
}
