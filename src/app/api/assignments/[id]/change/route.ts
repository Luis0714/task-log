import "server-only";

import { NextResponse } from "next/server";

import { splitAssignmentOnChange } from "@/lib/assignments/split-on-change";
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
import { getRepositories } from "@/lib/db";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { changeAssignmentBodySchema } from "@/lib/schemas/assignments";
import { requireManagementUser } from "@/app/api/assignments/helpers";

export const dynamic = "force-dynamic";

function codeToKey(code: AssignmentErrorCode): AssignmentErrorKey {
  for (const [key, value] of Object.entries(ASSIGNMENT_ERROR_CODES)) {
    if (value === code && isAssignmentErrorKey(key)) return key;
  }
  return "roleRequired";
}

export async function POST(
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

  const parsed = changeAssignmentBodySchema.safeParse(body);
  if (!parsed.success) {
    const raw = parsed.error.issues[0]?.message;
    const code = (typeof raw === "string" ? raw : ASSIGNMENT_ERROR_CODES.roleRequired) as AssignmentErrorCode;
    const key = codeToKey(code);
    return NextResponse.json(
      { error: ASSIGNMENT_USER_MESSAGES[key], code },
      { status: ASSIGNMENT_HTTP_STATUS[key] ?? 400 },
    );
  }

  const repo = getRepositories().personProjectAssignment;
  const existing = await repo.findById(id);
  if (!existing) {
    const key: AssignmentErrorKey = "notFound";
    return NextResponse.json(
      { error: ASSIGNMENT_USER_MESSAGES[key], code: ASSIGNMENT_ERROR_CODES.notFound },
      { status: ASSIGNMENT_HTTP_STATUS[key] },
    );
  }

  try {
    const { created, closed } = await splitAssignmentOnChange(repo, {
      existing,
      newValidFrom: new Date(parsed.data.validFrom),
      newAssignmentPct: parsed.data.newAssignmentPct,
      newRoleId: parsed.data.newRoleId ?? null,
      createdByUserId: auth.userId,
    });

    const allCurrent = await repo.listByPerson(existing.personAdoId);
    const sentinel = new Date("9999-12-31T00:00:00Z").getTime();
    const overlappingWithNew = allCurrent.filter(
      (r) =>
        r.id !== closed.id &&
        (() => {
          const aStart = created.validFrom.getTime();
          const aEnd = created.validTo?.getTime() ?? sentinel;
          const bStart = r.validFrom.getTime();
          const bEnd = r.validTo?.getTime() ?? sentinel;
          return aStart <= bEnd && bStart <= aEnd;
        })(),
    );
    const validation = validateNewAssignment({
      candidate: {
        projectId: created.projectId,
        teamId: created.teamId ?? null,
        validFrom: created.validFrom,
        validTo: created.validTo,
        assignmentPct: created.assignmentPct,
      },
      overlapping: overlappingWithNew,
    });
    if (!validation.ok) {
      const key: AssignmentErrorKey = "conflictProject";
      return NextResponse.json(
        {
          error: ASSIGNMENT_USER_MESSAGES[key],
          code: ASSIGNMENT_ERROR_CODES.conflictProject,
          currentTotal: validation.currentTotal,
          conflictingPct: validation.conflictingPct,
        },
        { status: ASSIGNMENT_HTTP_STATUS[key] },
      );
    }

    const enriched = await repo.findByIdWithRole(created.id);
    if (!enriched) {
      return NextResponse.json(
        { error: "No pudimos guardar el cambio." },
        { status: 500 },
      );
    }
    return NextResponse.json({ assignment: assignmentRowToDto(enriched) });
  } catch {
    return NextResponse.json(
      { error: "No pudimos guardar el cambio." },
      { status: 500 },
    );
  }
}
