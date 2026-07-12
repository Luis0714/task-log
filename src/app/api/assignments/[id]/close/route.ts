import "server-only";

import { NextResponse } from "next/server";

import { assignmentRowToDto } from "@/lib/assignments/build-assignment-row";
import {
  ASSIGNMENT_ERROR_CODES,
  ASSIGNMENT_HTTP_STATUS,
  ASSIGNMENT_USER_MESSAGES,
  type AssignmentErrorKey,
} from "@/lib/assignments/error-codes";
import { getRepositories } from "@/lib/db";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { closeAssignmentBodySchema } from "@/lib/schemas/assignments";
import { requireManagementUser } from "@/app/api/assignments/helpers";

export const dynamic = "force-dynamic";

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

  const parsed = closeAssignmentBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: USER_MESSAGES.invalidPayload },
      { status: 400 },
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
    await repo.updateEnd({
      id,
      validTo: new Date(parsed.data.validTo),
    });
    const enriched = await repo.findByIdWithRole(id);
    if (!enriched) {
      return NextResponse.json(
        { error: "No pudimos cerrar la asignación." },
        { status: 500 },
      );
    }
    return NextResponse.json({ assignment: assignmentRowToDto(enriched) });
  } catch {
    return NextResponse.json(
      { error: "No pudimos cerrar la asignación." },
      { status: 500 },
    );
  }
}
