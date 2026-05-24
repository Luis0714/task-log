import { NextResponse } from "next/server";
import { isOAuthAuthMethod, isPatAuthMethod } from "@/lib/auth/auth-method";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { logWorkOnWorkItem } from "@/lib/azure-devops/work-items";
import { executeRequestSchema } from "@/lib/schemas/agent";

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = executeRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload inválido: solo se puede ejecutar una vista previa de tipo log_work." },
      { status: 422 },
    );
  }

  const { preview, project } = parsed.data;
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

  const result = await logWorkOnWorkItem(
    {
      workItemId: preview.workItemId,
      hours: preview.hours,
      comment: preview.comment,
    },
    authForExecute,
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        error: "No se pudo registrar en Azure DevOps.",
        detail: result.body,
        status: result.status,
      },
      { status: result.status >= 400 && result.status < 600 ? result.status : 502 },
    );
  }

  return NextResponse.json({
    success: true,
    workItemId: preview.workItemId,
    hours: preview.hours,
    newCompletedWork: result.newCompletedWork,
  });
}
