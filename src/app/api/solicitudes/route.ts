import { NextResponse } from "next/server";

import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { createSolicitudBodySchema } from "@/lib/schemas/solicitudes";
import { listMySolicitudes } from "@/lib/novedades/list-my-solicitudes";
import { createSolicitud } from "@/lib/novedades/create-solicitud";

export const dynamic = "force-dynamic";

export async function GET() {
  const caller = await requireAdoCaller();
  if (!caller.ok) return apiErrorResponse(caller.message, 401);

  try {
    const solicitudes = await listMySolicitudes(caller.auth);
    return NextResponse.json({ solicitudes });
  } catch (cause) {
    return apiErrorFromCause("solicitudes GET", cause, USER_MESSAGES.loadFailed);
  }
}

export async function POST(req: Request) {
  const caller = await requireAdoCaller();
  if (!caller.ok) return apiErrorResponse(caller.message, 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiErrorResponse(USER_MESSAGES.invalidJsonBody, 400);
  }

  const parsed = createSolicitudBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiErrorResponse(
      parsed.error.issues[0]?.message ?? USER_MESSAGES.invalidPayload,
      400,
    );
  }

  const scopedAuth = await getScopedProjectAuth(parsed.data.project);
  if (!scopedAuth) return apiErrorResponse(USER_MESSAGES.notConnected, 401);

  try {
    const result = await createSolicitud(scopedAuth, parsed.data);
    if (!result.ok) return apiErrorResponse(result.message, result.status);
    return NextResponse.json(
      { workItemId: result.workItemId, url: result.url },
      { status: 201 },
    );
  } catch (cause) {
    return apiErrorFromCause("solicitudes POST", cause, USER_MESSAGES.taskCreateFailed);
  }
}
