import "server-only";

import { NextResponse } from "next/server";

import { assignmentRowToDto } from "@/lib/assignments/build-assignment-row";
import {
  ASSIGNMENT_ERROR_CODES,
  ASSIGNMENT_HTTP_STATUS,
  ASSIGNMENT_USER_MESSAGES,
  type AssignmentErrorCode,
  type AssignmentErrorKey,
  isAssignmentErrorKey,
} from "@/lib/assignments/error-codes";
import { validateNewAssignment } from "@/lib/assignments/validate-new-assignment";
import { checkOverAllocation } from "@/lib/assignments/over-allocation";
import { endOfDay, startOfDay } from "@/lib/assignments/is-assignment-open";
import { getRepositories } from "@/lib/db";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { editAssignmentBodySchema } from "@/lib/schemas/assignments";
import { requireManagementUser } from "@/app/api/assignments/helpers";

export const dynamic = "force-dynamic";

function codeToKey(code: AssignmentErrorCode): AssignmentErrorKey {
  for (const [key, value] of Object.entries(ASSIGNMENT_ERROR_CODES)) {
    if (value === code && isAssignmentErrorKey(key)) return key;
  }
  return "pctRange";
}

function notFound() {
  const key: AssignmentErrorKey = "notFound";
  return NextResponse.json(
    {
      error: ASSIGNMENT_USER_MESSAGES[key],
      code: ASSIGNMENT_ERROR_CODES.notFound,
    },
    { status: ASSIGNMENT_HTTP_STATUS[key] },
  );
}

/** Violación de índice único en Postgres (SQLSTATE 23505). */
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "23505"
  );
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireManagementUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: USER_MESSAGES.invalidPayload },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: USER_MESSAGES.invalidJsonBody },
      { status: 400 },
    );
  }

  const parsed = editAssignmentBodySchema.safeParse(body);
  if (!parsed.success) {
    const raw = parsed.error.issues[0]?.message;
    const code = (typeof raw === "string"
      ? raw
      : ASSIGNMENT_ERROR_CODES.pctRange) as AssignmentErrorCode;
    const key = codeToKey(code);
    return NextResponse.json(
      { error: ASSIGNMENT_USER_MESSAGES[key], code },
      { status: ASSIGNMENT_HTTP_STATUS[key] ?? 400 },
    );
  }

  const repo = getRepositories().personProjectAssignment;
  const existing = await repo.findById(id);
  if (!existing) return notFound();

  // Modelo: UNA sola asignación por (persona, proyecto, equipo). Editar
  // actualiza SIEMPRE la misma fila; nunca se crea otra. Se fusionan solo los
  // campos presentes en el patch con los valores actuales.
  const newStart = parsed.data.validFrom
    ? new Date(parsed.data.validFrom)
    : existing.validFrom;
  const newProject = parsed.data.projectId ?? existing.projectId;
  const newProjectName = parsed.data.projectName ?? existing.projectName;
  const newTeamId =
    parsed.data.teamId !== undefined ? parsed.data.teamId : existing.teamId ?? null;
  const newTeamName =
    parsed.data.teamName !== undefined ? parsed.data.teamName : existing.teamName ?? null;
  const newRoleId =
    parsed.data.roleId !== undefined ? parsed.data.roleId : existing.roleId;
  const newPct = parsed.data.assignmentPct ?? existing.assignmentPct;
  // undefined = no se toca; null = se borra la fecha fin; fecha = se fija.
  const finalValidTo =
    parsed.data.validTo === undefined
      ? existing.validTo ?? null
      : parsed.data.validTo
        ? new Date(parsed.data.validTo)
        : null;

  // Valida contra las demás vigencias de la persona que se cruzan con la NUEVA
  // ventana: una sola por slot (overlapSameProject) y suma <= 100% (over100).
  const overlapping = await repo.listOverlappingForPerson({
    personAdoId: existing.personAdoId,
    from: newStart,
    to: finalValidTo,
    excludeAssignmentId: id,
  });
  const validation = validateNewAssignment({
    candidate: {
      projectId: newProject,
      teamId: newTeamId,
      validFrom: newStart,
      validTo: finalValidTo,
      assignmentPct: newPct,
    },
    overlapping,
  });
  if (!validation.ok) {
    if (validation.code === "over100") {
      const check = checkOverAllocation({
        personDisplayName: existing.personDisplayName,
        others: overlapping.map((r) => ({
          projectName: r.projectName,
          teamName: r.teamName,
          pct: r.assignmentPct,
          fromMs: startOfDay(r.validFrom).getTime(),
          toMs: r.validTo ? endOfDay(r.validTo).getTime() : null,
        })),
        candidate: {
          fromMs: startOfDay(newStart).getTime(),
          toMs: finalValidTo ? endOfDay(finalValidTo).getTime() : null,
          pct: newPct,
          projectName: newProjectName,
          teamName: newTeamName,
        },
      });
      return NextResponse.json(
        {
          error: check.ok ? ASSIGNMENT_USER_MESSAGES.over100 : check.message,
          code: ASSIGNMENT_ERROR_CODES.over100,
          currentTotal: check.ok ? validation.currentTotal : check.total,
          conflictingPct: validation.conflictingPct,
        },
        { status: ASSIGNMENT_HTTP_STATUS.over100 },
      );
    }
    return NextResponse.json(
      {
        error: ASSIGNMENT_USER_MESSAGES[validation.code],
        code: ASSIGNMENT_ERROR_CODES[validation.code],
        currentTotal: validation.currentTotal,
        conflictingPct: validation.conflictingPct,
      },
      { status: ASSIGNMENT_HTTP_STATUS[validation.code] },
    );
  }

  try {
    await repo.update({
      id,
      projectId: newProject,
      projectName: newProjectName,
      teamId: newTeamId,
      teamName: newTeamName,
      roleId: newRoleId ?? null,
      assignmentPct: newPct,
      validFrom: newStart,
      validTo: finalValidTo,
    });
    const enriched = await repo.findByIdWithRole(id);
    if (!enriched) {
      return NextResponse.json(
        { error: "No pudimos actualizar la asignación." },
        { status: 500 },
      );
    }
    return NextResponse.json({ assignment: assignmentRowToDto(enriched) });
  } catch (err) {
    // Defensa ante carreras con el índice único de "una abierta por slot".
    if (isUniqueViolation(err)) {
      return NextResponse.json(
        {
          error: ASSIGNMENT_USER_MESSAGES.openExists,
          code: ASSIGNMENT_ERROR_CODES.openExists,
        },
        { status: ASSIGNMENT_HTTP_STATUS.openExists },
      );
    }
    console.error("[assignments PATCH] update failed", err);
    return NextResponse.json(
      { error: "No pudimos actualizar la asignación." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireManagementUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: USER_MESSAGES.invalidPayload },
      { status: 400 },
    );
  }

  const repo = getRepositories().personProjectAssignment;
  const existing = await repo.findById(id);
  if (!existing) return notFound();

  try {
    await repo.deleteById(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No pudimos eliminar la asignación." },
      { status: 500 },
    );
  }
}
