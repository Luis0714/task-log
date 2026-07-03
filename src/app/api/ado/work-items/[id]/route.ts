import { NextResponse } from "next/server";
import { z } from "zod";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { updateBacklogItemState } from "@/lib/azure-devops/update-backlog-item-state";
import { updateWorkItemState, deleteWorkItem, changeWorkItemParent } from "@/lib/azure-devops/work-items";
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
            responsables: parsed.data.responsables,
            workflowTag: parsed.data.workflowTag,
            tags: parsed.data.tags,
          },
          scopedAuth,
        )
      : await updateWorkItemState(
          {
            workItemId,
            state: parsed.data.state,
            workingDate: parsed.data.workingDate,
            workingTime: parsed.data.workingTime,
            completedWork: parsed.data.completedWork,
            title: parsed.data.title,
            description: parsed.data.description,
            activity: parsed.data.activity,
            reopenedDate: parsed.data.reopenedDate,
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

    if (parsed.data.newParentId && !isBacklogWorkItemUpdate(parsed.data)) {
      const parentResult = await changeWorkItemParent(workItemId, parsed.data.newParentId, scopedAuth);
      if (!parentResult.ok) {
        logApiError("ado/work-items PATCH parent", { status: parentResult.status, body: parentResult.body });
        return apiErrorResponse(
          "Los campos se guardaron pero no se pudo re-asignar la HU padre.",
          parentResult.status >= 400 && parentResult.status < 600 ? parentResult.status : 502,
        );
      }
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

const deleteWorkItemBodySchema = z.object({ project: z.string().min(1) });

export async function DELETE(req: Request, context: RouteContext) {
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

  const parsed = deleteWorkItemBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiErrorResponse(USER_MESSAGES.invalidPayload, 400);
  }

  const auth = await resolveAdoCaller({ persistOAuthTokens: true });
  if (!auth) {
    return apiErrorResponse(ADO_SIGN_IN_REQUIRED_MESSAGE, 401);
  }

  try {
    const scopedAuth = withAdoProject(auth, parsed.data.project);
    const result = await deleteWorkItem(workItemId, scopedAuth);

    if (!result.ok) {
      logApiError("ado/work-items DELETE", { status: result.status, body: result.body });
      return apiErrorResponse(
        USER_MESSAGES.workItemDeleteFailed,
        result.status >= 400 && result.status < 600 ? result.status : 502,
      );
    }

    return NextResponse.json({ ok: true });
  } catch (cause) {
    return apiErrorFromCause(
      "ado/work-items DELETE",
      cause,
      USER_MESSAGES.workItemDeleteFailed,
    );
  }
}