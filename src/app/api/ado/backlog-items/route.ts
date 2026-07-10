import { NextResponse } from "next/server";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { listBacklogWorkItems } from "@/lib/azure-devops/backlog-items";
import type { AdoWorkItemOptionDto } from "@/lib/schemas/ado-catalog";

/**
 * Devuelve las historias (PBIs / HUs) del backlog del proyecto activo.
 *
 * Acepta `?project=<name>` para que el cliente pueda pedir el backlog del
 * proyecto seleccionado (no solo del proyecto por defecto del caller).
 *
 * Replica el alcance que usa `/time-log` cuando se elige "Backlog completo":
 * WIQL sobre el `backlogItemType` configurado en el proyecto (sin filtros de
 * asignado, equipo ni sprint) y devuelve hasta `BACKLOG_ITEMS_LIMIT` (500)
 * historias enriquecidas como `AdoWorkItemOptionDto`.
 */
export async function GET(req: Request): Promise<
  NextResponse<{ pbis: AdoWorkItemOptionDto[] }>
> {
  const url = new URL(req.url);
  const projectParam = url.searchParams.get("project")?.trim();

  const auth = projectParam
    ? await getScopedProjectAuth(projectParam)
    : await resolveAdoCaller({ persistOAuthTokens: true });
  if (!auth) {
    return NextResponse.json({ pbis: [] });
  }

  const pbis = await listBacklogWorkItems(auth);
  return NextResponse.json({ pbis });
}