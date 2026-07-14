import "server-only";

import { createNovedadUnderStory } from "@/lib/azure-devops/create-novedad";
import type { AdoCallerAuth } from "@/lib/azure-devops/resolve-auth";
import {
  assertSolicitudContext,
  findAssigneeByUniqueName,
  mapAdoFailureToSolicitud,
  resolveSolicitudTiming,
} from "@/lib/novedades/solicitud-context";
import type { SolicitudMutationResult } from "@/lib/novedades/news-story-link";
import { SOLICITUD_ERROR_CODES } from "@/lib/solicitudes/error-codes";
import type { CreateSolicitudBody } from "@/lib/schemas/solicitudes";

/**
 * Valida la membresía del proyecto y la HU destino, convierte el tiempo a
 * horas (CA-21) y crea la novedad en Azure (CA-28). Sin reintentos ni
 * idempotencia.
 */
export type CreateSolicitudResult = SolicitudMutationResult;

export async function createSolicitud(
  auth: AdoCallerAuth,
  body: CreateSolicitudBody,
): Promise<CreateSolicitudResult> {
  const context = await assertSolicitudContext(auth, body);
  if (!context.ok) return context;

  const assignee = findAssigneeByUniqueName(context.members, body.assignedTo);
  if (!assignee) {
    return { ok: false, status: 400, message: SOLICITUD_ERROR_CODES.assigneeNotMember };
  }

  const { hours, fechaReintegro } = resolveSolicitudTiming(body);

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
      fechaReintegro,
      hours,
    },
    auth,
  );

  if (!result.ok) return mapAdoFailureToSolicitud(result.status, result.body);

  return { ok: true, workItemId: result.workItemId, url: result.url };
}
