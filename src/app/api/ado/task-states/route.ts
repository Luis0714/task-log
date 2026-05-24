import { NextResponse } from "next/server";

import { isOAuthAuthMethod, isPatAuthMethod } from "@/lib/auth/auth-method";
import { listTaskStates } from "@/lib/azure-devops/task-states";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import {
  pickDefaultCompletedTaskState,
  pickDefaultOpenTaskState,
} from "@/lib/time-log/task-state-utils";

export async function GET(req: Request) {
  const auth = await resolveAdoCaller();
  if (!auth) {
    const error = isPatAuthMethod()
      ? "No hay conexión con Azure DevOps. Configura AZDO_ORGANIZATION, AZDO_PROJECT y AZDO_PAT."
      : isOAuthAuthMethod()
        ? "No hay conexión con Azure DevOps. Conecta tu cuenta con OAuth."
        : "No hay conexión con Azure DevOps.";
    return NextResponse.json({ error }, { status: 401 });
  }

  const project = new URL(req.url).searchParams.get("project")?.trim();
  const authForProject = project ? withAdoProject(auth, project) : auth;

  try {
    const states = await listTaskStates(authForProject);
    return NextResponse.json({
      states,
      defaultOpenState: pickDefaultOpenTaskState(states),
      defaultCompletedState: pickDefaultCompletedTaskState(states),
    });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "Error desconocido";
    return NextResponse.json(
      { error: "No se pudieron cargar los estados de Task.", detail },
      { status: 502 },
    );
  }
}
