import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { logWorkOnWorkItem } from "@/lib/azure-devops/work-items";
import { apiErrorResponse } from "@/lib/errors/api-error-response";
import { logApiError } from "@/lib/errors/log-api-error";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { executeRequestSchema, type LogWorkItem } from "@/lib/schemas/agent";

type ExecuteResultEntry =
  | {
      index: number;
      ok: true;
      workItemId: number;
      hours: number;
      newCompletedWork?: number;
    }
  | {
      index: number;
      ok: false;
      workItemId: number;
      status: number;
      body?: string;
    };

type ExecuteResponse = {
  results: ExecuteResultEntry[];
  successCount: number;
  failureCount: number;
};

export async function POST(req: Request): Promise<Response> {
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

  const auth = await resolveAdoCaller({ persistOAuthTokens: true });
  if (!auth) {
    return apiErrorResponse(ADO_SIGN_IN_REQUIRED_MESSAGE, 401);
  }

  const project = parsed.data.project;
  const authForExecute = project ? withAdoProject(auth, project) : auth;

  const items: LogWorkItem[] =
    parsed.data.action === "log_work_batch"
      ? parsed.data.previews
      : [parsed.data.preview];

  const results: ExecuteResultEntry[] = [];
  let successCount = 0;
  let failureCount = 0;
  let stop = false;

  for (let index = 0; index < items.length && !stop; index += 1) {
    const item = items[index]!;
    const result = await logWorkOnWorkItem(
      {
        workItemId: item.workItemId,
        hours: item.hours,
        comment: item.comment,
      },
      authForExecute,
    );

    if (!result.ok) {
      logApiError("execute POST", { status: result.status, body: result.body });
      results.push({
        index,
        ok: false,
        workItemId: item.workItemId,
        status: result.status,
        body: result.body,
      });
      failureCount += 1;
      stop = true;
      continue;
    }

    results.push({
      index,
      ok: true,
      workItemId: item.workItemId,
      hours: item.hours,
      newCompletedWork: result.newCompletedWork,
    });
    successCount += 1;
  }

  const response: ExecuteResponse = {
    results,
    successCount,
    failureCount,
  };
  return Response.json(response);
}