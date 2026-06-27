import { NextResponse } from "next/server";

import { getRepositories, isUserPersistenceReady } from "@/lib/db";
import { isIronSessionConfigured } from "@/lib/auth/session";
import { getTaskPilotSession } from "@/lib/auth/session";
import { createTimeLogTemplateBodySchema } from "@/lib/schemas/time-log-template";
import { templateRowToDto } from "@/lib/time-log/template-dto";
import {
  getRoleNameForUser,
  getTemplatesForUser,
} from "@/lib/time-log/templates";
import { USER_MESSAGES } from "@/lib/errors/user-messages";

export const dynamic = "force-dynamic";

async function requireSessionUserId(): Promise<
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
  const roleName = await getRoleNameForUser(userId);
  return { ok: true, userId, roleName };
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

export async function GET() {
  const auth = await requireSessionUserId();
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
  const auth = await requireSessionUserId();
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
