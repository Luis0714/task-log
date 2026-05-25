import { NextResponse } from "next/server";

import { isOAuthAuthMethod, isPatAuthMethod } from "@/lib/auth/auth-method";
import { getBacklogFieldsMetadata } from "@/lib/azure-devops/backlog-item-fields";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";

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
  if (!project) {
    return NextResponse.json({ error: "Falta el parámetro project." }, { status: 400 });
  }

  try {
    const metadata = await getBacklogFieldsMetadata(withAdoProject(auth, project));
    return NextResponse.json(metadata);
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "Error desconocido";
    return NextResponse.json(
      { error: "No se pudieron cargar los campos del backlog.", detail },
      { status: 502 },
    );
  }
}
