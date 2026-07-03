import { NextResponse } from "next/server";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import {
  listBacklogItemStates,
  type AdoWorkItemTypeState,
} from "@/lib/azure-devops/work-item-type-states";

/**
 * Endpoint único para los estados del work item "Product Backlog Item" (HU).
 *
 * Acepta `?project=<name>` para que el cliente pueda pedir explícitamente los
 * estados del proyecto seleccionado (no solo del proyecto por defecto del
 * caller). Sin `project`, usa el caller autenticado.
 *
 * Cacheado 1h server-side (ver `createTtlCache` en `work-item-type-states`).
 */
export type BacklogStatesResponse = {
  states: AdoWorkItemTypeState[];
};

export async function GET(req: Request): Promise<NextResponse<BacklogStatesResponse>> {
  const url = new URL(req.url);
  const projectParam = url.searchParams.get("project")?.trim();

  const auth = projectParam
    ? await getScopedProjectAuth(projectParam)
    : await resolveAdoCaller({ persistOAuthTokens: true });

  if (!auth) {
    return NextResponse.json<BacklogStatesResponse>({ states: [] }, { status: 401 });
  }

  const profile = await resolveProcessProfile(auth);
  const states = await listBacklogItemStates(auth, profile.backlogItemType);

  return NextResponse.json<BacklogStatesResponse>(
    { states },
    {
      headers: {
        // Cache del navegador: 5 min. El server cache de Azure maneja 1h.
        "Cache-Control": "private, max-age=300",
      },
    },
  );
}