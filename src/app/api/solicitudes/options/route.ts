import { NextResponse } from "next/server";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { solicitudOptionsQuerySchema } from "@/lib/schemas/solicitudes";
import { loadSolicitudOptions } from "@/lib/novedades/solicitud-options";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = solicitudOptionsQuerySchema.safeParse({
    project: url.searchParams.get("project") ?? "",
  });
  if (!parsed.success) {
    return apiErrorResponse(
      parsed.error.issues[0]?.message ?? USER_MESSAGES.invalidPayload,
      400,
    );
  }

  const scopedAuth = await getScopedProjectAuth(parsed.data.project);
  if (!scopedAuth) return apiErrorResponse(USER_MESSAGES.notConnected, 401);

  try {
    const options = await loadSolicitudOptions(scopedAuth);
    return NextResponse.json(options);
  } catch (cause) {
    return apiErrorFromCause("solicitudes/options GET", cause, USER_MESSAGES.loadFailed);
  }
}
