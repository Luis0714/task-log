import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { createTaskUnderPbi } from "@/lib/azure-devops/work-items";
import { apiErrorResponse } from "@/lib/errors/api-error-response";
import { logApiError } from "@/lib/errors/log-api-error";
import { mapTaskCreateError } from "@/lib/errors/map-task-create-error";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import {
  executeCreateTasksBatchRequestSchema,
  type CreateTaskBatchItem,
} from "@/lib/schemas/agent";
import type { TaskActivity } from "@/lib/time-log/task-constants";

type CreateTaskResultEntry =
  | {
      index: number;
      ok: true;
      taskId: number;
      pbiId: number;
      hours: number;
      completedWork: number;
      markedAsDone: boolean;
    }
  | {
      index: number;
      ok: false;
      pbiId: number;
      status: number;
      message: string;
    };

type CreateTasksBatchResponse = {
  results: CreateTaskResultEntry[];
  successCount: number;
  failureCount: number;
  error: string | null;
};

export async function POST(req: Request): Promise<Response> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiErrorResponse(USER_MESSAGES.invalidJsonBody, 400);
  }

  const parsed = executeCreateTasksBatchRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return apiErrorResponse(USER_MESSAGES.invalidPayload, 422);
  }

  const auth = await resolveAdoCaller({ persistOAuthTokens: true });
  if (!auth) {
    return apiErrorResponse(ADO_SIGN_IN_REQUIRED_MESSAGE, 401);
  }

  const project = parsed.data.project;
  const authForExecute = project ? withAdoProject(auth, project) : auth;

  const tasks: CreateTaskBatchItem[] = parsed.data.tasks;

  const results: CreateTaskResultEntry[] = [];
  let successCount = 0;
  let failureCount = 0;
  let firstFailureMessage: string | null = null;
  let stop = false;

  for (let index = 0; index < tasks.length && !stop; index += 1) {
    const task = tasks[index]!;
    const result = await createTaskUnderPbi(
      {
        pbiId: task.pbiId,
        title: task.title,
        hours: task.hours,
        description: task.description,
        activity: task.activity as TaskActivity,
        workingDate: task.workingDate,
        workingTime: task.workingTime,
        state: task.state,
        sprintPath: task.sprintPath,
        markAsDone: task.markAsDone ?? true,
      },
      authForExecute,
    );

    if (!result.ok) {
      logApiError("create-tasks-batch POST", {
        status: result.status,
        body: result.body,
      });
      const message = mapTaskCreateError(result.body);
      results.push({
        index,
        ok: false,
        pbiId: task.pbiId,
        status: result.status,
        message,
      });
      failureCount += 1;
      if (!firstFailureMessage) firstFailureMessage = message;
      stop = true;
      continue;
    }

    results.push({
      index,
      ok: true,
      taskId: result.taskId,
      pbiId: task.pbiId,
      hours: task.hours,
      completedWork: result.completedWork,
      markedAsDone: result.markedAsDone,
    });
    successCount += 1;
  }

  const response: CreateTasksBatchResponse = {
    results,
    successCount,
    failureCount,
    error: firstFailureMessage,
  };
  return Response.json(response, {
    status: successCount === 0 && failureCount > 0 ? 502 : 200,
  });
}