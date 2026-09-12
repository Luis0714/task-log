import { NextResponse } from "next/server";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { createPullRequest } from "@/lib/git/create-pull-request";
import { loadPullRequestList } from "@/lib/git/load-pull-request-list";
import {
  createPullRequestBodySchema,
  listPullRequestsQuerySchema,
} from "@/lib/schemas/git-pull-request";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = listPullRequestsQuerySchema.safeParse({
    project: url.searchParams.get("project") ?? "",
    status: url.searchParams.get("status") ?? "active",
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
    const snapshot = await loadPullRequestList(parsed.data);
    return NextResponse.json(snapshot);
  } catch (cause) {
    return apiErrorFromCause(
      "ado/git/pull-requests GET",
      cause,
      "No se pudieron listar los pull requests en Azure DevOps.",
    );
  }
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiErrorResponse(USER_MESSAGES.invalidJsonBody, 400);
  }

  const parsed = createPullRequestBodySchema.safeParse(raw);
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
    const created = await createPullRequest(parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (cause) {
    return apiErrorFromCause(
      "ado/git/pull-requests POST",
      cause,
      "No se pudo crear el pull request en Azure DevOps.",
    );
  }
}
