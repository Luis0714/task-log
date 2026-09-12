import { NextResponse } from "next/server";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { loadPullRequestDetail } from "@/lib/git/load-pull-request-detail";
import { updatePullRequest } from "@/lib/git/update-pull-request";
import { parsePullRequestId } from "@/lib/pull-requests/detail-path";
import {
  pullRequestDetailQuerySchema,
  updatePullRequestBodySchema,
} from "@/lib/schemas/git-pull-request-detail";

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
  const parsed = pullRequestDetailQuerySchema.safeParse({
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
    const detail = await loadPullRequestDetail({
      ...parsed.data,
      pullRequestId,
    });
    return NextResponse.json(detail);
  } catch (cause) {
    return apiErrorFromCause(
      "ado/git/pull-requests/[id] GET",
      cause,
      "No se pudo cargar el pull request en Azure DevOps.",
    );
  }
}

export async function PATCH(req: Request, context: RouteContext) {
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

  const parsed = updatePullRequestBodySchema.safeParse(raw);
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
    const mutation =
      parsed.data.action === "vote"
        ? { action: "vote" as const, vote: parsed.data.vote }
        : { action: parsed.data.action };
    const detail = await updatePullRequest({
      project: parsed.data.project,
      repository: parsed.data.repository,
      pullRequestId,
      mutation,
    });
    return NextResponse.json(detail);
  } catch (cause) {
    return apiErrorFromCause(
      "ado/git/pull-requests/[id] PATCH",
      cause,
      "No se pudo actualizar el pull request en Azure DevOps.",
    );
  }
}
