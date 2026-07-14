import { NextResponse } from "next/server";

import { getRepositories } from "@/lib/db";
import { createTimeLogTemplateBodySchema } from "@/lib/schemas/time-log-template";
import { templateRowToDto } from "@/lib/time-log/template-dto";
import {
  getRoleNameForUser,
  getTemplatesForUser,
} from "@/lib/time-log/templates";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import {
  rejectNonAdminIfGlobal,
  requireTemplateSessionUser,
} from "@/app/api/time-log/templates/helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireTemplateSessionUser(getRoleNameForUser);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const templates = await getTemplatesForUser(auth.userId, auth.roleName);
    return NextResponse.json({ templates });
  } catch {
    return NextResponse.json(
      { error: "No pudimos cargar las plantillas." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireTemplateSessionUser(getRoleNameForUser);
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

  const parsed = createTimeLogTemplateBodySchema.safeParse(body);
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

  try {
    const { timeLogTemplate } = getRepositories();
    const row = await timeLogTemplate.create(auth.userId, parsed.data);
    // El autor de una plantilla creada desde /time-log es el propio
    // usuario actual; la UI ya conoce su nombre.
    return NextResponse.json(
      { template: templateRowToDto(row, null) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "No pudimos guardar la plantilla." },
      { status: 500 },
    );
  }
}
