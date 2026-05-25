import { NextResponse } from "next/server";

import { isOAuthAuthMethod, isPatAuthMethod } from "@/lib/auth/auth-method";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { updateWorkItemState } from "@/lib/azure-devops/work-items";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { updateWorkItemBodySchema } from "@/lib/schemas/work-item-update";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  const { id: idParam } = await context.params;
  const workItemId = Number.parseInt(idParam, 10);

  if (!Number.isFinite(workItemId) || workItemId <= 0) {
    return NextResponse.json({ error: "ID de work item inválido." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const parsed = updateWorkItemBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", detail: parsed.error.flatten() },
      { status: 400 },
    );
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
    const scopedAuth = withAdoProject(auth, parsed.data.project);
    const result = await updateWorkItemState(
      {
        workItemId,
        state: parsed.data.state,
        workingDate: parsed.data.workingDate,
        completedWork: parsed.data.completedWork,
      },
      scopedAuth,
    );

    if (!result.ok) {
      const detail = result.body;
      const needsWorkingDate =
        detail.includes("Working Date") || detail.includes("Custom.WorkingDate");
      const needsCompletedWork =
        detail.includes("Completed Work") || detail.includes("CompletedWork");
      const message =
        result.status === 403
          ? "Permisos insuficientes para actualizar este work item."
          : needsWorkingDate
            ? "Azure DevOps exige la fecha de trabajo (Working Date) para cambiar el estado."
            : needsCompletedWork
              ? "Azure DevOps exige Completed Work para cambiar el estado."
              : "No se pudo actualizar el estado.";
      return NextResponse.json(
        { error: message, detail: result.body },
        { status: result.status >= 400 && result.status < 600 ? result.status : 502 },
      );
    }

    return NextResponse.json({ ok: true, state: result.state });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "Error desconocido";
    return NextResponse.json(
      { error: "No se pudo actualizar el work item.", detail },
      { status: 502 },
    );
  }
}
