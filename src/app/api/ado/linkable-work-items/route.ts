import { NextResponse } from "next/server";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { linkableWorkItemsQuerySchema } from "@/lib/schemas/linkable-work-items";
import { loadLinkableWorkItems } from "@/lib/work-items/load-linkable-work-items";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = linkableWorkItemsQuerySchema.safeParse({
    project: url.searchParams.get("project") ?? "",
    team: url.searchParams.get("team") ?? "",
    includeBacklog: url.searchParams.get("includeBacklog") ?? "false",
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
    const items = await loadLinkableWorkItems({
      project: parsed.data.project,
      team: parsed.data.team,
      includeBacklog: parsed.data.includeBacklog ?? false,
    });
    return NextResponse.json({ items });
  } catch (cause) {
    return apiErrorFromCause(
      "ado/linkable-work-items GET",
      cause,
      "No se pudieron cargar los work items.",
    );
  }
}
