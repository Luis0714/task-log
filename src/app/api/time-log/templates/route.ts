import { NextResponse } from "next/server";

import { getRepositories, isUserPersistenceReady } from "@/lib/db";
import { isIronSessionConfigured } from "@/lib/auth/session";
import { getTaskPilotSession } from "@/lib/auth/session";
import { createTimeLogTemplateBodySchema } from "@/lib/schemas/time-log-template";
import type { TimeLogTemplateDto } from "@/lib/schemas/time-log-template";
import {
  getRoleNameForUser,
  listTemplatesForUser,
} from "@/lib/time-log/templates";
import { USER_MESSAGES } from "@/lib/errors/user-messages";

export const dynamic = "force-dynamic";

function toDto(row: {
  id: string;
  name: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultActivity: string | null;
  isSystem: boolean;
  seedKey: string | null;
  userId: string | null;
  createdAt: Date | string;
}): TimeLogTemplateDto {
  return {
    id: row.id,
    name: row.name,
    defaultTitle: row.defaultTitle,
    defaultDescription: row.defaultDescription,
    defaultActivity: row.defaultActivity,
    isSystem: row.isSystem,
    seedKey: row.seedKey,
    userId: row.userId,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  };
}

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

export async function GET() {
  const auth = await requireSessionUserId();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const rows = await listTemplatesForUser(auth.userId, auth.roleName);
    return NextResponse.json({ templates: rows.map(toDto) });
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

  try {
    const { timeLogTemplate } = getRepositories();
    const row = await timeLogTemplate.create(auth.userId, parsed.data);
    return NextResponse.json({ template: toDto(row) }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "No pudimos guardar la plantilla." },
      { status: 500 },
    );
  }
}
