import { NextResponse } from "next/server";

import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import {
  parseReportedNewsDateFilter,
  parseReportedNewsScopes,
} from "@/lib/azure-devops/parse-reported-news-query";
import { getServerAuthState } from "@/lib/auth/server-state";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { listSolicitudesForUser } from "@/lib/novedades/list-solicitudes-for-user";
import { createSolicitud } from "@/lib/novedades/create-solicitud";
import {
  createSolicitudBodySchema,
  solicitudesListQuerySchema,
} from "@/lib/schemas/solicitudes";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const caller = await requireAdoCaller();
  if (!caller.ok) return apiErrorResponse(caller.message, 401);

  const url = new URL(req.url);
  const parsedQuery = solicitudesListQuerySchema.safeParse({
    scopes: url.searchParams.get("scopes") ?? undefined,
    mode: url.searchParams.get("mode") ?? undefined,
    month: url.searchParams.get("month") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    assignee: url.searchParams.get("assignee") ?? undefined,
  });
  if (!parsedQuery.success) {
    return apiErrorResponse(
      parsedQuery.error.issues[0]?.message ?? USER_MESSAGES.invalidPayload,
      400,
    );
  }

  const scopesResult = parseReportedNewsScopes(parsedQuery.data.scopes ?? null);
  if (!scopesResult.ok) return apiErrorResponse(scopesResult.error, 400);
  if (scopesResult.value.length === 0) {
    return NextResponse.json({ solicitudes: [] });
  }

  const dateFilterResult = parseReportedNewsDateFilter({
    month: parsedQuery.data.month ?? null,
    from: parsedQuery.data.from ?? null,
    to: parsedQuery.data.to ?? null,
  });
  if (!dateFilterResult.ok) return apiErrorResponse(dateFilterResult.error, 400);

  try {
    const authState = await getServerAuthState();
    const solicitudes = await listSolicitudesForUser(
      {
        auth: caller.auth,
        scopes: scopesResult.value,
        dateFilter: dateFilterResult.value,
        ...(parsedQuery.data.assignee
          ? { assigneeFilter: parsedQuery.data.assignee }
          : {}),
      },
      {
        isManagement: authState.isManagement,
        currentUserDisplayName: authState.profileDisplayName,
      },
    );
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
