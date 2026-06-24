import { NextResponse } from "next/server";

import { getRepositories, isUserPersistenceReady } from "@/lib/db";
import { isIronSessionConfigured } from "@/lib/auth/session";
import { getTaskPilotSession } from "@/lib/auth/session";
import { updateTimeLogTemplateBodySchema } from "@/lib/schemas/time-log-template";
import { templateRowToDto } from "@/lib/time-log/template-dto";
import {
  TimeLogTemplateNotFoundError,
} from "@/lib/db/ports/time-log-template.repository.port";
import { USER_MESSAGES } from "@/lib/errors/user-messages";

export const dynamic = "force-dynamic";

async function requireSessionUser(): Promise<
  | { ok: true; userId: string; roleName: string | null }
  | { ok: false; status: number; error: string }
> {
  if (!isIronSessionConfigured() || !isUserPersistenceReady()) {
    return { ok: false, status: 403, error: "No autorizado." };
  }
  const session = await getTaskPilotSession();
  const userId = session.taskPilotUserId?.trim();
  if (!userId) {
    return { ok: false, status: 401, error: "No autorizado." };
  }
  return { ok: true, userId, roleName: session.userRole ?? null };
}

function rejectNonAdminIfGlobal(
  isGlobal: boolean | undefined,
  roleName: string | null,
): { ok: true } | { ok: false; status: number; error: string } {
  if (!isGlobal) return { ok: true };
  if (roleName === "super_admin") return { ok: true };
  return {
    ok: false,
    status: 403,
    error: "Solo un super administrador puede crear plantillas globales.",
  };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSessionUser();
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
  const auth = await requireSessionUser();
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
