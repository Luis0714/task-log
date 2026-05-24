import { NextResponse } from "next/server";

import { isOAuthAuthMethod, isPatAuthMethod } from "@/lib/auth/auth-method";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { createTaskUnderPbi } from "@/lib/azure-devops/work-items";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { executeCreateTaskRequestSchema } from "@/lib/schemas/agent";
import type { TaskActivity } from "@/lib/time-log/task-constants";

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = executeCreateTaskRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload inválido para crear la tarea." },
      { status: 422 },
    );
  }

  const { task, project } = parsed.data;
  const auth = await resolveAdoCaller();
  if (!auth) {
    const error = isPatAuthMethod()
      ? "No hay conexión con Azure DevOps. Configura AZDO_ORGANIZATION, AZDO_PROJECT y AZDO_PAT en el servidor."
      : isOAuthAuthMethod()
        ? "No hay conexión con Azure DevOps. Conecta tu cuenta con OAuth."
        : "No hay conexión con Azure DevOps.";
    return NextResponse.json({ error }, { status: 401 });
  }

  const authForExecute = project ? withAdoProject(auth, project) : auth;

  const result = await createTaskUnderPbi(
    {
      pbiId: task.pbiId,
      title: task.title,
      hours: task.hours,
      description: task.description,
      activity: task.activity as TaskActivity,
      workingDate: task.workingDate,
      state: task.state,
      sprintPath: task.sprintPath,
    },
    authForExecute,
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        error: "No se pudo crear la tarea en Azure DevOps.",
        detail: result.body,
        status: result.status,
      },
      { status: result.status >= 400 && result.status < 600 ? result.status : 502 },
    );
  }

  return NextResponse.json({
    success: true,
    taskId: result.taskId,
    pbiId: task.pbiId,
    hours: task.hours,
    completedWork: result.completedWork,
  });
}
