import { NextResponse } from "next/server";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { loadReleaseList } from "@/lib/releases/load-release-list";
import { listReleasesQuerySchema } from "@/lib/schemas/ado-releases";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const definition = url.searchParams.get("definitionId");
  const parsed = listReleasesQuerySchema.safeParse({
    project: url.searchParams.get("project") ?? "",
    definitionId: definition || undefined,
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
    const snapshot = await loadReleaseList(parsed.data);
    return NextResponse.json(snapshot);
  } catch (cause) {
    return apiErrorFromCause(
      "ado/releases GET",
      cause,
      "No se pudieron listar los releases en Azure DevOps.",
    );
  }
}
