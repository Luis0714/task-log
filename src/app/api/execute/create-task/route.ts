import { NextResponse } from "next/server";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { createTaskUnderPbi } from "@/lib/azure-devops/work-items";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import {
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { logApiError } from "@/lib/errors/log-api-error";
import { formatAdoErrorMessage } from "@/lib/errors/parse-ado-error";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { executeCreateTaskRequestSchema } from "@/lib/schemas/agent";
import type { TaskActivity } from "@/lib/time-log/task-constants";

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiErrorResponse(USER_MESSAGES.invalidJsonBody, 400);
  }

  const parsed = executeCreateTaskRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return apiErrorResponse(USER_MESSAGES.invalidPayload, 422);
  }

  const { task, project } = parsed.data;
  const auth = await resolveAdoCaller({ persistOAuthTokens: true });
  if (!auth) {
    return apiErrorResponse(ADO_SIGN_IN_REQUIRED_MESSAGE, 401);
  }

  const authForExecute = project ? withAdoProject(auth, project) : auth;

  const result = await createTaskUnderPbi(
    {
      pbiId: task.pbiId,
      title: task.title,
      hours: task.hours,
      description: task.description,
      activity: task.activity as TaskActivity,
      workingDate: task.workingDate,
      state: task.state,
      sprintPath: task.sprintPath,
      markAsDone: task.markAsDone,
    },
    authForExecute,
  );

  if (!result.ok) {
    logApiError("execute/create-task", { status: result.status, body: result.body });
    return apiErrorResponse(
      formatAdoErrorMessage(result.body) || USER_MESSAGES.taskCreateFailed,
      result.status >= 400 && result.status < 600 ? result.status : 502,
    );
  }

  return NextResponse.json({
    success: true,
    taskId: result.taskId,
    pbiId: task.pbiId,
    hours: task.hours,
    completedWork: result.completedWork,
    markedAsDone: result.markedAsDone,
  });
}
