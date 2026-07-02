import { NextResponse } from "next/server";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { uploadAttachment } from "@/lib/azure-devops/attachments";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { apiErrorFromCause, apiErrorResponse } from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await resolveAdoCaller({ persistOAuthTokens: true });
  if (!auth) {
    return apiErrorResponse(ADO_SIGN_IN_REQUIRED_MESSAGE, 401);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return apiErrorResponse(USER_MESSAGES.invalidJsonBody, 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return apiErrorResponse(USER_MESSAGES.invalidPayload, 400);
  }

  try {
    const buffer = await file.arrayBuffer();
    const result = await uploadAttachment(auth, buffer, file.name);
    if (!result) {
      return apiErrorResponse(USER_MESSAGES.attachmentUploadFailed, 502);
    }
    return NextResponse.json({ url: result.url });
  } catch (cause) {
    return apiErrorFromCause(
      "ado/attachments POST",
      cause,
      USER_MESSAGES.attachmentUploadFailed,
    );
  }
}
