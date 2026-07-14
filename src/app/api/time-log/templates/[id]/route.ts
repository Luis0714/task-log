import { NextResponse } from "next/server";

import { getRepositories } from "@/lib/db";
import { updateTimeLogTemplateBodySchema } from "@/lib/schemas/time-log-template";
import { templateRowToDto } from "@/lib/time-log/template-dto";
import {
  TimeLogTemplateNotFoundError,
} from "@/lib/db/ports/time-log-template.repository.port";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import {
  rejectNonAdminIfGlobal,
  requireTemplateSessionUser,
} from "@/app/api/time-log/templates/helpers";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireTemplateSessionUser();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
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

  const parsed = updateTimeLogTemplateBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? USER_MESSAGES.invalidPayload },
      { status: 400 },
    );
  }

  const roleCheck = rejectNonAdminIfGlobal(parsed.data.isGlobal, auth.roleName);
  if (!roleCheck.ok) {
    return NextResponse.json({ error: roleCheck.error }, { status: roleCheck.status });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: USER_MESSAGES.invalidPayload },
      { status: 400 },
    );
  }

  try {
    const row = await getRepositories().timeLogTemplate.updateForUser(
      auth.userId,
      id,
      parsed.data,
    );
    // Para una plantilla personal editada por su dueño, authorName siempre
    // es el usuario actual (la UI ya lo conoce).
    return NextResponse.json({ template: templateRowToDto(row, null) });
  } catch (err) {
    if (err instanceof TimeLogTemplateNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "No pudimos guardar los cambios." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireTemplateSessionUser();
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

  try {
    await getRepositories().timeLogTemplate.deleteForUser(auth.userId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof TimeLogTemplateNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "No pudimos eliminar la plantilla." },
      { status: 500 },
    );
  }
}
