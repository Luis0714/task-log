import { NextResponse } from "next/server";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { loadPullRequestThreads } from "@/lib/pull-requests/load-pull-request-threads";
import { mutatePullRequestThread } from "@/lib/pull-requests/mutate-pull-request-thread";
import { parsePullRequestId } from "@/lib/pull-requests/detail-path";
import {
  createPullRequestThreadBodySchema,
  pullRequestThreadsQuerySchema,
} from "@/lib/schemas/ado-pull-request-threads";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const pullRequestId = parsePullRequestId(id);
  if (!pullRequestId) {
    return apiErrorResponse("El identificador del pull request no es válido.", 400);
  }

  const url = new URL(req.url);
  const parsed = pullRequestThreadsQuerySchema.safeParse({
    project: url.searchParams.get("project") ?? "",
    repository: url.searchParams.get("repository") ?? undefined,
  });
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
    const threads = await loadPullRequestThreads({
      ...parsed.data,
      pullRequestId,
    });
    return NextResponse.json({ threads });
  } catch (cause) {
    return apiErrorFromCause(
      "ado/git/pull-requests/[id]/threads GET",
      cause,
      "No se pudieron listar los comentarios del pull request.",
    );
  }
}

export async function POST(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const pullRequestId = parsePullRequestId(id);
  if (!pullRequestId) {
    return apiErrorResponse("El identificador del pull request no es válido.", 400);
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiErrorResponse(USER_MESSAGES.invalidJsonBody, 400);
  }

  const parsed = createPullRequestThreadBodySchema.safeParse(raw);
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
      action: "create",
      pullRequestId,
      ...parsed.data,
    });
    return NextResponse.json({ threads });
  } catch (cause) {
    return apiErrorFromCause(
      "ado/git/pull-requests/[id]/threads POST",
      cause,
      "No se pudo publicar el comentario en Azure DevOps.",
    );
  }
}
