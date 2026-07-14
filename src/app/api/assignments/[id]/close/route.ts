import "server-only";

import { NextResponse } from "next/server";

import { assignmentRowToDto } from "@/lib/assignments/build-assignment-row";
import { getRepositories } from "@/lib/db";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { closeAssignmentBodySchema } from "@/lib/schemas/assignments";
import {
  assignmentNotFoundResponse,
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

  const parsed = closeAssignmentBodySchema.safeParse(rawBody.body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: USER_MESSAGES.invalidPayload },
      { status: 400 },
    );
  }

  const repo = getRepositories().personProjectAssignment;
  const existing = await repo.findById(id);
  if (!existing) return assignmentNotFoundResponse();

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
