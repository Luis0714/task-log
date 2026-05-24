import { NextResponse } from "next/server";

import { isOAuthAuthMethod, isPatAuthMethod } from "@/lib/auth/auth-method";
import { listWorkItemsInSprint } from "@/lib/azure-devops/sprints";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";

export async function GET(req: Request) {
  const sprintPath = new URL(req.url).searchParams.get("sprintPath")?.trim();
  if (!sprintPath) {
    return NextResponse.json({ error: "Falta el parámetro sprintPath." }, { status: 400 });
  }

  if (sprintPath.length > 500) {
    return NextResponse.json({ error: "sprintPath demasiado largo." }, { status: 400 });
  }

  const auth = await resolveAdoCaller();
  if (!auth) {
    const error = isPatAuthMethod()
      ? "No hay conexión con Azure DevOps. Configura AZDO_ORGANIZATION, AZDO_PROJECT y AZDO_PAT."
      : isOAuthAuthMethod()
        ? "No hay conexión con Azure DevOps. Conecta tu cuenta con OAuth."
        : "No hay conexión con Azure DevOps.";
    return NextResponse.json({ error }, { status: 401 });
  }

  try {
    const workItems = await listWorkItemsInSprint(auth, sprintPath);
    return NextResponse.json({ workItems });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "Error desconocido";
    return NextResponse.json(
      { error: "No se pudieron cargar los work items.", detail },
      { status: 502 },
    );
  }
}
