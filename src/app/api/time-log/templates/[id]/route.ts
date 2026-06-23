import { NextResponse } from "next/server";

import { getRepositories, isUserPersistenceReady } from "@/lib/db";
import { isIronSessionConfigured } from "@/lib/auth/session";
import { getTaskPilotSession } from "@/lib/auth/session";
import { createTimeLogTemplateBodySchema } from "@/lib/schemas/time-log-template";
import type { TimeLogTemplateDto } from "@/lib/schemas/time-log-template";
import {
  TimeLogTemplateNotFoundError,
} from "@/lib/db/ports/time-log-template.repository.port";
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

async function requireUserId(): Promise<
  | { ok: true; userId: string }
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
  return { ok: true, userId };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireUserId();
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
    return NextResponse.json({ template: toDto(row) });
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
  const auth = await requireUserId();
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
