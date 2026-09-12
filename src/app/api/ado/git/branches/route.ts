import { NextResponse } from "next/server";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { loadGitBranches } from "@/lib/git/load-git-branches";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const project = url.searchParams.get("project")?.trim() ?? "";
  const repository = url.searchParams.get("repository")?.trim() ?? "";

  if (!project) return apiErrorResponse("Indica el proyecto.", 400);
  if (!repository) return apiErrorResponse("Indica el repositorio.", 400);

  const caller = await requireAdoCaller();
  if (!caller.ok) {
    return apiErrorResponse(ADO_SIGN_IN_REQUIRED_MESSAGE, 401);
  }

  try {
    const branches = await loadGitBranches(project, repository);
    return NextResponse.json({ branches });
  } catch (cause) {
    return apiErrorFromCause(
      "ado/git/branches GET",
      cause,
      USER_MESSAGES.loadFailed,
    );
  }
}
