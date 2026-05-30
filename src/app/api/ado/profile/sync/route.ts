import { NextResponse } from "next/server";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { resolveAdoProfile } from "@/lib/auth/resolve-ado-profile";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await resolveAdoCaller({ persistOAuthTokens: true });
  if (!auth) {
    return apiErrorResponse(ADO_SIGN_IN_REQUIRED_MESSAGE, 401);
  }

  try {
    const profile = await resolveAdoProfile(auth, { persist: true });
    if (!profile) {
      return apiErrorResponse(USER_MESSAGES.profileSyncFailed, 502);
    }

    return NextResponse.json({ ok: true });
  } catch (cause) {
    return apiErrorFromCause(
      "ado/profile/sync POST",
      cause,
      USER_MESSAGES.profileSyncFailed,
    );
  }
}
