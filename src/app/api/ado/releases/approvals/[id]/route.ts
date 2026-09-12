import { NextResponse } from "next/server";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { approveRelease } from "@/lib/releases/approve-release";
import { approveReleaseBodySchema } from "@/lib/schemas/ado-releases";
import { parsePositiveInt } from "@/lib/shared/parse-positive-int";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const approvalId = parsePositiveInt(id);
  if (!approvalId) {
    return apiErrorResponse("El identificador de la aprobación no es válido.", 400);
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiErrorResponse(USER_MESSAGES.invalidJsonBody, 400);
  }

  const project =
    typeof raw === "object" && raw !== null && "project" in raw
      ? raw.project
      : "";
  const parsed = approveReleaseBodySchema.safeParse({
    project,
    approvalId,
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
    await approveRelease(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (cause) {
    return apiErrorFromCause(
      "ado/releases/approvals PATCH",
      cause,
      "No se pudo aprobar el despliegue en Azure DevOps.",
    );
  }
}
