import { NextResponse } from "next/server";

import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { sprintSnapshotQuerySchema } from "@/lib/schemas/sprint-snapshot";
import { loadSprintSnapshotScreen } from "@/lib/sprints/load-sprint-snapshot-screen";
import { resolveSprintScopeRequest } from "@/lib/sprints/resolve-sprint-scope-request";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const resolved = await resolveSprintScopeRequest(req, sprintSnapshotQuerySchema);
  if (!resolved.ok) {
    return resolved.response;
  }

  try {
    const screen = await loadSprintSnapshotScreen(resolved.scope);

    if (screen.error) {
      return apiErrorResponse(screen.error, 502);
    }

    return NextResponse.json({
      snapshot: screen.snapshot,
      persistenceReady: screen.persistenceReady,
    });
  } catch (cause) {
    return apiErrorFromCause(
      "sprints/snapshot GET",
      cause,
      "No se pudo cargar la retrospectiva del sprint.",
    );
  }
}
