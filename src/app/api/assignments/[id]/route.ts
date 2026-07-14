import "server-only";

import { NextResponse } from "next/server";

import { assignmentRowToDto } from "@/lib/assignments/build-assignment-row";
import {
  ASSIGNMENT_ERROR_CODES,
  ASSIGNMENT_HTTP_STATUS,
  ASSIGNMENT_USER_MESSAGES,
} from "@/lib/assignments/error-codes";
import { validateNewAssignment } from "@/lib/assignments/validate-new-assignment";
import { checkOverAllocation } from "@/lib/assignments/over-allocation";
import { endOfDay, startOfDay } from "@/lib/assignments/is-assignment-open";
import { getRepositories } from "@/lib/db";
import { editAssignmentBodySchema } from "@/lib/schemas/assignments";
import {
  assignmentNotFoundResponse,
  assignmentSchemaErrorResponse,
  readJsonBody,
  requireAssignmentMutationContext,
} from "@/app/api/assignments/helpers";

export const dynamic = "force-dynamic";

/** Violación de índice único en Postgres (SQLSTATE 23505). */
function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "23505"
  );
}

type AssignmentRepo = ReturnType<typeof getRepositories>["personProjectAssignment"];
type ExistingAssignment = NonNullable<Awaited<ReturnType<AssignmentRepo["findById"]>>>;
type OverlappingAssignment = Awaited<
  ReturnType<AssignmentRepo["listOverlappingForPerson"]>
>[number];
type EditAssignmentPatch = ReturnType<typeof editAssignmentBodySchema.parse>;
type AssignmentValidationFailure = Extract<
  ReturnType<typeof validateNewAssignment>,
  { ok: false }
>;

/** undefined = no se toca; null = se borra la fecha fin; fecha = se fija. */
function resolveFinalValidTo(
  patchValidTo: string | null | undefined,
  existingValidTo: Date | null,
): Date | null {
  if (patchValidTo === undefined) return existingValidTo ?? null;
  return patchValidTo ? new Date(patchValidTo) : null;
}

/**
 * Fusiona el patch con los valores actuales. Modelo: UNA sola asignación por
 * (persona, proyecto, equipo); editar actualiza SIEMPRE la misma fila.
 */
function mergeAssignmentPatch(
  existing: ExistingAssignment,
  patch: EditAssignmentPatch,
) {
  return {
    validFrom: patch.validFrom ? new Date(patch.validFrom) : existing.validFrom,
    projectId: patch.projectId ?? existing.projectId,
    projectName: patch.projectName ?? existing.projectName,
    teamId: patch.teamId !== undefined ? patch.teamId : existing.teamId ?? null,
    teamName: patch.teamName !== undefined ? patch.teamName : existing.teamName ?? null,
    roleId: patch.roleId !== undefined ? patch.roleId : existing.roleId,
    assignmentPct: patch.assignmentPct ?? existing.assignmentPct,
    validTo: resolveFinalValidTo(patch.validTo, existing.validTo),
  };
}

/** Construye la respuesta de error cuando la validación de vigencias falla. */
function buildAssignmentConflictResponse(
  validation: AssignmentValidationFailure,
  existing: ExistingAssignment,
  overlapping: OverlappingAssignment[],
  candidate: {
    fromMs: number;
    toMs: number | null;
    pct: number;
    projectName: string;
    teamName: string | null;
  },
): NextResponse {
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
      candidate,
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAssignmentMutationContext(params);
  if (!ctx.ok) return ctx.response;
  const { id } = ctx;

  const rawBody = await readJsonBody(req);
  if (!rawBody.ok) return rawBody.response;

  const parsed = editAssignmentBodySchema.safeParse(rawBody.body);
  if (!parsed.success) {
    return assignmentSchemaErrorResponse(
      parsed.error.issues[0]?.message,
      "pctRange",
    );
  }

  const repo = getRepositories().personProjectAssignment;
  const existing = await repo.findById(id);
  if (!existing) return assignmentNotFoundResponse();

  const merged = mergeAssignmentPatch(existing, parsed.data);

  // Valida contra las demás vigencias de la persona que se cruzan con la NUEVA
  // ventana: una sola por slot (overlapSameProject) y suma <= 100% (over100).
  const overlapping = await repo.listOverlappingForPerson({
    personAdoId: existing.personAdoId,
    from: merged.validFrom,
    to: merged.validTo,
    excludeAssignmentId: id,
  });
  const validation = validateNewAssignment({
    candidate: {
      projectId: merged.projectId,
      teamId: merged.teamId,
      validFrom: merged.validFrom,
      validTo: merged.validTo,
      assignmentPct: merged.assignmentPct,
    },
    overlapping,
  });
  if (!validation.ok) {
    return buildAssignmentConflictResponse(validation, existing, overlapping, {
      fromMs: startOfDay(merged.validFrom).getTime(),
      toMs: merged.validTo ? endOfDay(merged.validTo).getTime() : null,
      pct: merged.assignmentPct,
      projectName: merged.projectName,
      teamName: merged.teamName,
    });
  }

  try {
    await repo.update({
      id,
      projectId: merged.projectId,
      projectName: merged.projectName,
      teamId: merged.teamId,
      teamName: merged.teamName,
      roleId: merged.roleId ?? null,
      assignmentPct: merged.assignmentPct,
      validFrom: merged.validFrom,
      validTo: merged.validTo,
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
  const ctx = await requireAssignmentMutationContext(params);
  if (!ctx.ok) return ctx.response;
  const { id } = ctx;

  const repo = getRepositories().personProjectAssignment;
  const existing = await repo.findById(id);
  if (!existing) return assignmentNotFoundResponse();

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
