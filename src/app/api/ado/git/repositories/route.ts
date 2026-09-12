import { NextResponse } from "next/server";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { loadGitRepositories } from "@/lib/git/load-git-repositories";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const project = new URL(req.url).searchParams.get("project")?.trim() ?? "";
  if (!project) {
    return apiErrorResponse("Indica el proyecto.", 400);
  }

  const caller = await requireAdoCaller();
  if (!caller.ok) {
    return apiErrorResponse(ADO_SIGN_IN_REQUIRED_MESSAGE, 401);
  }

  try {
    const repositories = await loadGitRepositories(project);
    return NextResponse.json({ repositories });
  } catch (cause) {
    return apiErrorFromCause(
      "ado/git/repositories GET",
      cause,
      USER_MESSAGES.loadFailed,
    );
  }
}
