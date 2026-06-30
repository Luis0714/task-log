import { NextResponse } from "next/server";

import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import {
  listBacklogItemStates,
  type AdoWorkItemTypeState,
} from "@/lib/azure-devops/work-item-type-states";

/**
 * Endpoint único para los estados del work item "Product Backlog Item" (HU).
 *
 * Devuelve el catálogo canónico de Azure DevOps:
 *   `GET /wit/workitemtypes/{type}/states?api-version=7.1`
 * con shape `{ name, category, color }` por estado. Cacheado 1h server-side.
 *
 * El cliente debe cachear localmente (ver `useBacklogItemStates`) para evitar
 * fetches repetidos entre páginas.
 */
export type BacklogStatesResponse = {
  states: AdoWorkItemTypeState[];
};

export async function GET(): Promise<NextResponse<BacklogStatesResponse>> {
  const auth = await resolveAdoCaller({ persistOAuthTokens: true });
  if (!auth) {
    return NextResponse.json<BacklogStatesResponse>({ states: [] }, { status: 401 });
  }

  const profile = await resolveProcessProfile(auth);
  const states = await listBacklogItemStates(auth, profile.backlogItemType);

  return NextResponse.json<BacklogStatesResponse>(
    { states },
    {
      headers: {
        // Cache del navegador (no-store en dev, cacheado en prod).
        "Cache-Control": "private, max-age=300",
      },
    },
  );
}