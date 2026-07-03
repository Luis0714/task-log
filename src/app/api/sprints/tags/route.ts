import { NextResponse } from "next/server";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { loadProjectWorkItemTags } from "@/lib/sprints/load-project-work-item-tags";
import { sprintTagsQuerySchema } from "@/lib/schemas/sprint-tags";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = sprintTagsQuerySchema.safeParse({
    project: url.searchParams.get("project") ?? "",
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
    const snapshot = await loadProjectWorkItemTags(parsed.data.project);
    if (snapshot.error) {
      return apiErrorResponse(snapshot.error, 502);
    }

    return NextResponse.json({ tags: snapshot.tags });
  } catch (cause) {
    return apiErrorFromCause(
      "sprints/tags GET",
      cause,
      "No se pudieron cargar los tags del proyecto.",
    );
  }
}
