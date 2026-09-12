import { NextResponse } from "next/server";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { loadFileDiff } from "@/lib/git/load-file-diff";
import { gitFileDiffQuerySchema } from "@/lib/schemas/git-compare";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = gitFileDiffQuerySchema.safeParse({
    project: url.searchParams.get("project") ?? "",
    repository: url.searchParams.get("repository") ?? "",
    source: url.searchParams.get("source") ?? "",
    target: url.searchParams.get("target") ?? "",
    path: url.searchParams.get("path") ?? "",
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
    const file = await loadFileDiff(parsed.data);
    return NextResponse.json({ file });
  } catch (cause) {
    return apiErrorFromCause(
      "ado/git/file-diff GET",
      cause,
      "No se pudo cargar el diff del archivo.",
    );
  }
}
