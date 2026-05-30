import { NextResponse } from "next/server";

import { mapErrorToUserMessage } from "@/lib/errors/map-error-to-user-message";
import { logApiError } from "@/lib/errors/log-api-error";
import { USER_MESSAGES } from "@/lib/errors/user-messages";

export function apiErrorResponse(
  message: string,
  status: number,
): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function apiErrorFromCause(
  context: string,
  cause: unknown,
  fallback: string = USER_MESSAGES.genericRetry,
  status = 502,
): NextResponse {
  logApiError(context, cause);
  return apiErrorResponse(mapErrorToUserMessage(cause, fallback), status);
}
