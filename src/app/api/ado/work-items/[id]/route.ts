import { NextResponse } from "next/server";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { updateBacklogItemState } from "@/lib/azure-devops/update-backlog-item-state";
import { updateWorkItemState } from "@/lib/azure-devops/work-items";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { logApiError } from "@/lib/errors/log-api-error";
import { mapAdoWorkItemUpdateError } from "@/lib/errors/map-ado-work-item-update-error";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import {
  isBacklogWorkItemUpdate,
  updateWorkItemBodySchema,
} from "@/lib/schemas/work-item-update";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  const { id: idParam } = await context.params;
  const workItemId = Number.parseInt(idParam, 10);

  if (!Number.isFinite(workItemId) || workItemId <= 0) {
    return apiErrorResponse(USER_MESSAGES.invalidWorkItemId, 400);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiErrorResponse(USER_MESSAGES.invalidJsonBody, 400);
  }

  const parsed = updateWorkItemBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiErrorResponse(
      parsed.error.issues[0]?.message ?? USER_MESSAGES.invalidForm,
      400,
    );
  }

  const auth = await resolveAdoCaller({ persistOAuthTokens: true });
  if (!auth) {
    return apiErrorResponse(ADO_SIGN_IN_REQUIRED_MESSAGE, 401);
  }

  try {
    const scopedAuth = withAdoProject(auth, parsed.data.project);
    const result = isBacklogWorkItemUpdate(parsed.data)
      ? await updateBacklogItemState(
          {
            workItemId,
            state: parsed.data.state,
            team: parsed.data.team,
            startDate: parsed.data.startDate,
            targetDate: parsed.data.targetDate,
            responsableMaquetacion: parsed.data.responsableMaquetacion,
            responsableIntegrador: parsed.data.responsableIntegrador,
            responsableQA: parsed.data.responsableQA,
            workflowTag: parsed.data.workflowTag,
          },
          scopedAuth,
        )
      : await updateWorkItemState(
          {
            workItemId,
            state: parsed.data.state,
            workingDate: parsed.data.workingDate,
            completedWork: parsed.data.completedWork,
          },
          scopedAuth,
        );

    if (!result.ok) {
      logApiError("ado/work-items PATCH", { status: result.status, body: result.body });
      const message = mapAdoWorkItemUpdateError(result.status, result.body);
      return apiErrorResponse(
        message,
        result.status >= 400 && result.status < 600 ? result.status : 502,
      );
    }

    return NextResponse.json({ ok: true, state: result.state });
  } catch (cause) {
    return apiErrorFromCause(
      "ado/work-items PATCH",
      cause,
      USER_MESSAGES.workItemUpdateFailed,
    );
  }
}
