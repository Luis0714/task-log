import { NextResponse } from "next/server";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import {
  listBugStates,
  type AdoWorkItemTypeState,
} from "@/lib/azure-devops/work-item-type-states";

/**
 * Devuelve los estados del work item "Bug" del proyecto activo.
 *
 * Acepta `?project=<name>` para que el cliente pueda pedir explícitamente los
 * estados del proyecto seleccionado (no solo del proyecto por defecto del caller).
 */
export async function GET(req: Request): Promise<NextResponse<{ states: AdoWorkItemTypeState[] }>> {
  const url = new URL(req.url);
  const projectParam = url.searchParams.get("project")?.trim();

  const auth = projectParam
    ? await getScopedProjectAuth(projectParam)
    : await resolveAdoCaller({ persistOAuthTokens: true });
  if (!auth) {
    return NextResponse.json({ states: [] });
  }

  const profile = await resolveProcessProfile(auth);
  const states = await listBugStates(auth, profile.bugWorkItemType);

  return NextResponse.json({ states });
}