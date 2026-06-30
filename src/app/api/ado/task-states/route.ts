import { NextResponse } from "next/server";

import { getScopedProjectAuth } from "@/lib/ado/get-scoped-project-auth";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import {
  listTaskStates,
  type AdoWorkItemTypeState,
} from "@/lib/azure-devops/work-item-type-states";

export type TaskState = {
  name: string;
  color: string;
  category: string;
};

export type TaskStatesResponse = {
  states: TaskState[];
};

/**
 * Devuelve los estados del work item "Task" del proyecto seleccionado.
 *
 * Acepta `?project=<name>` para que el cliente pueda pedir explícitamente los
 * estados del proyecto activo (no solo del proyecto por defecto del caller).
 */
export async function GET(req: Request): Promise<NextResponse<TaskStatesResponse>> {
  const url = new URL(req.url);
  const projectParam = url.searchParams.get("project")?.trim();

  const auth = projectParam
    ? await getScopedProjectAuth(projectParam)
    : await resolveAdoCaller({ persistOAuthTokens: true });
  if (!auth) return NextResponse.json<TaskStatesResponse>({ states: [] });

  const profile = await resolveProcessProfile(auth);
  const states = await listTaskStates(auth, profile.taskWorkItemType);

  return NextResponse.json<TaskStatesResponse>({
    states: states.map((s: AdoWorkItemTypeState) => ({
      name: s.name,
      color: s.color,
      category: s.category,
    })),
  });
}