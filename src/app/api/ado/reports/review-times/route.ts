import { NextResponse } from "next/server";

import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { apiErrorFromCause, apiErrorResponse } from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { loadReviewTimes } from "@/lib/review-times/load-review-times";
import { reviewTimesQuerySchema } from "@/lib/schemas/review-times";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = reviewTimesQuerySchema.safeParse({
    project: url.searchParams.get("project") ?? "",
    monthKeys: url.searchParams.getAll("month"),
    repositories: url.searchParams.getAll("repository"),
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
    const snapshot = await loadReviewTimes(parsed.data);
    return NextResponse.json(snapshot);
  } catch (cause) {
    return apiErrorFromCause(
      "ado/reports/review-times GET",
      cause,
      "No se pudieron calcular los tiempos de revisión.",
    );
  }
}
