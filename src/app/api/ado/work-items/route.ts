import { NextResponse } from "next/server";

import { isOAuthAuthMethod, isPatAuthMethod } from "@/lib/auth/auth-method";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { listTasksInSprint, listWorkItemsInSprint } from "@/lib/azure-devops/work-items";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { WORK_ITEM_ASSIGNEE_ALL } from "@/lib/schemas/work-item-filters";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const project = params.get("project")?.trim();
  const sprintPath = params.get("sprintPath")?.trim();
  const assignee = params.get("assignee")?.trim() || WORK_ITEM_ASSIGNEE_ALL;
  const kind = params.get("kind")?.trim().toLowerCase();

  if (!project) {
    return NextResponse.json({ error: "Falta el parámetro project." }, { status: 400 });
  }

  if (!sprintPath) {
    return NextResponse.json({ error: "Falta el parámetro sprintPath." }, { status: 400 });
  }

  if (project.length > 200 || sprintPath.length > 500 || assignee.length > 200) {
    return NextResponse.json({ error: "Parámetros inválidos." }, { status: 400 });
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
    const scopedAuth = withAdoProject(auth, project);
    const workItems =
      kind === "tasks"
        ? await listTasksInSprint(scopedAuth, sprintPath, { assignee })
        : kind === "bugs"
          ? await listWorkItemsInSprint(scopedAuth, sprintPath, {
              assignee,
              workItemType: "Bug",
            })
          : await listWorkItemsInSprint(scopedAuth, sprintPath, { assignee });
    return NextResponse.json({ workItems });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "Error desconocido";
    return NextResponse.json(
      { error: "No se pudieron cargar los work items.", detail },
      { status: 502 },
    );
  }
}
