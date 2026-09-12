import { NextResponse } from "next/server";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { loadBranchCompare } from "@/lib/git/load-branch-compare";
import { gitCompareQuerySchema } from "@/lib/schemas/git-compare";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = gitCompareQuerySchema.safeParse({
    project: url.searchParams.get("project") ?? "",
    repository: url.searchParams.get("repository") ?? "",
    source: url.searchParams.get("source") ?? "",
    target: url.searchParams.get("target") ?? "",
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
    const changeset = await loadBranchCompare(parsed.data);
    return NextResponse.json(changeset);
  } catch (cause) {
    return apiErrorFromCause(
      "ado/git/compare GET",
      cause,
      "No se pudo comparar las ramas en Azure DevOps.",
    );
  }
}
