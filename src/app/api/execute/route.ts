import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import {
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { logApiError } from "@/lib/errors/log-api-error";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { logWorkOnWorkItem } from "@/lib/azure-devops/work-items";
import { executeRequestSchema } from "@/lib/schemas/agent";

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiErrorResponse(USER_MESSAGES.invalidJsonBody, 400);
  }

  const parsed = executeRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return apiErrorResponse(USER_MESSAGES.invalidPayload, 422);
  }

  const { preview, project } = parsed.data;
  const auth = await resolveAdoCaller({ persistOAuthTokens: true });
  if (!auth) {
    return apiErrorResponse(ADO_SIGN_IN_REQUIRED_MESSAGE, 401);
  }

  const authForExecute = project ? withAdoProject(auth, project) : auth;

  const result = await logWorkOnWorkItem(
    {
      workItemId: preview.workItemId,
      hours: preview.hours,
      comment: preview.comment,
    },
    authForExecute,
  );

  if (!result.ok) {
    logApiError("execute POST", { status: result.status, body: result.body });
    return apiErrorResponse(
      USER_MESSAGES.saveFailed,
      result.status >= 400 && result.status < 600 ? result.status : 502,
    );
  }

  return Response.json({
    success: true,
    workItemId: preview.workItemId,
    hours: preview.hours,
    newCompletedWork: result.newCompletedWork,
  });
}
