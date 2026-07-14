import "server-only";

import { NextResponse } from "next/server";

import { splitAssignmentOnChange } from "@/lib/assignments/split-on-change";
import { assignmentRowToDto } from "@/lib/assignments/build-assignment-row";
import {
  ASSIGNMENT_ERROR_CODES,
  ASSIGNMENT_HTTP_STATUS,
  ASSIGNMENT_USER_MESSAGES,
  type AssignmentErrorKey,
} from "@/lib/assignments/error-codes";
import { validateNewAssignment } from "@/lib/assignments/validate-new-assignment";
import { getRepositories } from "@/lib/db";
import { changeAssignmentBodySchema } from "@/lib/schemas/assignments";
import {
  assignmentNotFoundResponse,
  assignmentSchemaErrorResponse,
  readJsonBody,
  requireAssignmentMutationContext,
} from "@/app/api/assignments/helpers";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireAssignmentMutationContext(params);
  if (!ctx.ok) return ctx.response;
  const { id } = ctx;

  const rawBody = await readJsonBody(req);
  if (!rawBody.ok) return rawBody.response;

  const parsed = changeAssignmentBodySchema.safeParse(rawBody.body);
  if (!parsed.success) {
    return assignmentSchemaErrorResponse(
      parsed.error.issues[0]?.message,
      "roleRequired",
    );
  }

  const repo = getRepositories().personProjectAssignment;
  const existing = await repo.findById(id);
  if (!existing) return assignmentNotFoundResponse();

  try {
    const { created, closed } = await splitAssignmentOnChange(repo, {
      existing,
      newValidFrom: new Date(parsed.data.validFrom),
      newAssignmentPct: parsed.data.newAssignmentPct,
      newRoleId: parsed.data.newRoleId ?? null,
      createdByUserId: ctx.userId,
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
