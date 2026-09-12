import { NextResponse } from "next/server";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { mutatePullRequestThread } from "@/lib/pull-requests/mutate-pull-request-thread";
import { parsePullRequestId } from "@/lib/pull-requests/detail-path";
import { replyPullRequestThreadBodySchema } from "@/lib/schemas/ado-pull-request-threads";
import { parsePositiveInt } from "@/lib/shared/parse-positive-int";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string; threadId: string }>;
};

export async function POST(req: Request, context: RouteContext) {
  const { id, threadId: rawThreadId } = await context.params;
  const pullRequestId = parsePullRequestId(id);
  const threadId = parsePositiveInt(rawThreadId);
  if (!pullRequestId || !threadId) {
    return apiErrorResponse("El identificador del comentario no es válido.", 400);
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiErrorResponse(USER_MESSAGES.invalidJsonBody, 400);
  }

  const parsed = replyPullRequestThreadBodySchema.safeParse(raw);
  if (!parsed.success) {
    return apiErrorResponse(
      parsed.error.issues[0]?.message ?? USER_MESSAGES.invalidForm,
      400,
    );
  }

  const caller = await requireAdoCaller();
  if (!caller.ok) {
    return apiErrorResponse(ADO_SIGN_IN_REQUIRED_MESSAGE, 401);
  }

  try {
    const threads = await mutatePullRequestThread({
      action: "reply",
      pullRequestId,
      threadId,
      ...parsed.data,
    });
    return NextResponse.json({ threads });
  } catch (cause) {
    return apiErrorFromCause(
      "ado/git/pull-requests/[id]/threads/[threadId]/comments POST",
      cause,
      "No se pudo responder el comentario en Azure DevOps.",
    );
  }
}
