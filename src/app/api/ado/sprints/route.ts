import { NextResponse } from "next/server";

import { isOAuthAuthMethod, isPatAuthMethod } from "@/lib/auth/auth-method";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { listTeamSprints } from "@/lib/azure-devops/sprints";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const project = params.get("project")?.trim();
  const team = params.get("team")?.trim();

  if (!project) {
    return NextResponse.json({ error: "Falta el parámetro project." }, { status: 400 });
  }

  if (!team) {
    return NextResponse.json({ error: "Falta el parámetro team." }, { status: 400 });
  }

  if (project.length > 200 || team.length > 200) {
    return NextResponse.json({ error: "Parámetros demasiado largos." }, { status: 400 });
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
    const sprints = await listTeamSprints(withAdoProject(auth, project), team);
    return NextResponse.json({ sprints });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "Error desconocido";
    return NextResponse.json(
      { error: "No se pudieron cargar los sprints.", detail },
      { status: 502 },
    );
  }
}
