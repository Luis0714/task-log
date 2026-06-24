import { NextResponse } from "next/server";

import { getBacklogFieldsMetadata } from "@/lib/azure-devops/backlog-item-fields";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { resolveSettingsAuth } from "@/lib/settings/resolve-settings-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const project = url.searchParams.get("project")?.trim() ?? "";

  if (!project) {
    return apiErrorResponse("Indica el proyecto.", 400);
  }

  const authResult = await resolveSettingsAuth(project);
  if (!authResult.ok) {
    return apiErrorResponse(authResult.error, authResult.status);
  }

  try {
    const metadata = await getBacklogFieldsMetadata(authResult.auth);
    return NextResponse.json({
      workItemType: metadata.workItemType,
      responsableCandidates: metadata.responsableCandidates,
      fields: metadata.fields,
    });
  } catch (cause) {
    return apiErrorFromCause(
      "settings/process-profile/backlog-fields GET",
      cause,
      USER_MESSAGES.settingsLoadFailed,
    );
  }
}