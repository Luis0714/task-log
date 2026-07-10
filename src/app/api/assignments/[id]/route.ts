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
import { updateAssignmentPctBodySchema } from "@/lib/schemas/assignments";
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
    { error: ASSIGNMENT_USER_MESSAGES[key], code: ASSIGNMENT_ERROR_CODES.notFound },
    { status: ASSIGNMENT_HTTP_STATUS[key] },
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
    return NextResponse.json({ error: USER_MESSAGES.invalidPayload }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: USER_MESSAGES.invalidJsonBody }, { status: 400 });
  }

  const parsed = updateAssignmentPctBodySchema.safeParse(body);
  if (!parsed.success) {
    const raw = parsed.error.issues[0]?.message;
    const code = (typeof raw === "string" ? raw : ASSIGNMENT_ERROR_CODES.pctRange) as AssignmentErrorCode;
    const key = codeToKey(code);
    return NextResponse.json(
      { error: ASSIGNMENT_USER_MESSAGES[key], code },
      { status: ASSIGNMENT_HTTP_STATUS[key] ?? 400 },
    );
  }

  const repo = getRepositories().personProjectAssignment;
  const existing = await repo.findById(id);
  if (!existing) return notFound();

  // Validar que el nuevo % no genere sobreasignación GLOBAL: se consideran
  // todas las vigencias de la persona que se cruzan en el tiempo con esta
  // (en cualquier proyecto), excluyendo la propia fila.
  const overlapping = await repo.listOverlappingForPerson({
    personAdoId: existing.personAdoId,
    from: existing.validFrom,
    to: existing.validTo ?? null,
    excludeAssignmentId: id,
  });
  const validation = validateNewAssignment({
    candidate: {
      projectId: existing.projectId,
      teamId: existing.teamId ?? null,
      validFrom: existing.validFrom,
      validTo: existing.validTo ?? null,
      assignmentPct: parsed.data.assignmentPct,
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
          fromMs: startOfDay(existing.validFrom).getTime(),
          toMs: existing.validTo ? endOfDay(existing.validTo).getTime() : null,
          pct: parsed.data.assignmentPct,
          projectName: existing.projectName,
          teamName: existing.teamName,
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
    await repo.updatePct({ id, assignmentPct: parsed.data.assignmentPct });
    const enriched = await repo.findByIdWithRole(id);
    if (!enriched) {
      return NextResponse.json(
        { error: "No pudimos actualizar la asignación." },
        { status: 500 },
      );
    }
    return NextResponse.json({ assignment: assignmentRowToDto(enriched) });
  } catch {
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
    return NextResponse.json({ error: USER_MESSAGES.invalidPayload }, { status: 400 });
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
