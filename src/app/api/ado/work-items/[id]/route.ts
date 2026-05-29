import { NextResponse } from "next/server";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { updateBacklogItemState } from "@/lib/azure-devops/update-backlog-item-state";
import { updateWorkItemState } from "@/lib/azure-devops/work-items";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import {
  isBacklogWorkItemUpdate,
  updateWorkItemBodySchema,
} from "@/lib/schemas/work-item-update";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, context: RouteContext) {
  const { id: idParam } = await context.params;
  const workItemId = Number.parseInt(idParam, 10);

  if (!Number.isFinite(workItemId) || workItemId <= 0) {
    return NextResponse.json({ error: "ID de elemento de trabajo inválido." }, { status: 400 });
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
    return NextResponse.json({ error: ADO_SIGN_IN_REQUIRED_MESSAGE }, { status: 401 });
  }

  try {
    const scopedAuth = withAdoProject(auth, parsed.data.project);
    const result = isBacklogWorkItemUpdate(parsed.data)
      ? await updateBacklogItemState(
          {
            workItemId,
            state: parsed.data.state,
            team: parsed.data.team,
            startDate: parsed.data.startDate,
            targetDate: parsed.data.targetDate,
            responsableMaquetacion: parsed.data.responsableMaquetacion,
            responsableIntegrador: parsed.data.responsableIntegrador,
            responsableQA: parsed.data.responsableQA,
            workflowTag: parsed.data.workflowTag,
          },
          scopedAuth,
        )
      : await updateWorkItemState(
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
      const needsStartDate =
        detail.includes("Start Date") || detail.includes("StartDate");
      const needsTargetDate =
        detail.includes("Target Date") || detail.includes("TargetDate");
      const needsResponsable =
        detail.includes("Responsable") || detail.includes("Maquetacion");
      const message =
        result.status === 403
          ? "Permisos insuficientes para actualizar este elemento de trabajo."
          : needsWorkingDate
            ? "Azure DevOps exige la fecha de trabajo para cambiar el estado."
            : needsCompletedWork
              ? "Azure DevOps exige el trabajo completado para cambiar el estado."
              : needsStartDate
                ? "Azure DevOps exige la fecha de inicio para este cambio de estado."
                : needsTargetDate
                  ? "Azure DevOps exige la fecha objetivo para este cambio de estado."
                  : needsResponsable
                    ? "Azure DevOps exige completar los responsables para este cambio de estado."
                    : result.status === 400 && detail.length < 200
                      ? detail
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
      { error: "No se pudo actualizar el elemento de trabajo.", detail },
      { status: 502 },
    );
  }
}
