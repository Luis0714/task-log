import { NextResponse } from "next/server";
import { z } from "zod";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { createSolicitudBodySchema } from "@/lib/schemas/solicitudes";
import { updateSolicitud } from "@/lib/novedades/update-solicitud";
import { deleteSolicitud } from "@/lib/novedades/delete-solicitud";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function parseWorkItemId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  if (!Number.isFinite(id) || id <= 0) return null;
  return id;
}

export async function PATCH(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const workItemId = parseWorkItemId(id);
  if (!workItemId) return apiErrorResponse(USER_MESSAGES.invalidWorkItemId, 400);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiErrorResponse(USER_MESSAGES.invalidJsonBody, 400);
  }

  const parsed = createSolicitudBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiErrorResponse(
      parsed.error.issues[0]?.message ?? USER_MESSAGES.invalidForm,
      400,
    );
  }

  const scopedAuth = await getScopedProjectAuth(parsed.data.project);
  if (!scopedAuth) return apiErrorResponse(USER_MESSAGES.notConnected, 401);

  try {
    const result = await updateSolicitud(scopedAuth, workItemId, parsed.data);
    if (!result.ok) return apiErrorResponse(result.message, result.status);
    return NextResponse.json({ workItemId: result.workItemId, url: result.url });
  } catch (cause) {
    return apiErrorFromCause(
      "solicitudes PATCH",
      cause,
      USER_MESSAGES.workItemUpdateFailed,
    );
  }
}

const deleteSolicitudBodySchema = z.object({
  project: z.string().trim().min(1),
});

export async function DELETE(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const workItemId = parseWorkItemId(id);
  if (!workItemId) return apiErrorResponse(USER_MESSAGES.invalidWorkItemId, 400);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiErrorResponse(USER_MESSAGES.invalidJsonBody, 400);
  }

  const parsed = deleteSolicitudBodySchema.safeParse(body);
  if (!parsed.success) return apiErrorResponse(USER_MESSAGES.invalidPayload, 400);

  const scopedAuth = await getScopedProjectAuth(parsed.data.project);
  if (!scopedAuth) return apiErrorResponse(USER_MESSAGES.notConnected, 401);

  try {
    const result = await deleteSolicitud(scopedAuth, workItemId);
    if (!result.ok) return apiErrorResponse(result.message, result.status);
    return NextResponse.json({ ok: true });
  } catch (cause) {
    return apiErrorFromCause(
      "solicitudes DELETE",
      cause,
      USER_MESSAGES.workItemDeleteFailed,
    );
  }
}
