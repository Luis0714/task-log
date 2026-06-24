import "server-only";

import { NextResponse } from "next/server";

import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import {
  fetchAuthorNames,
} from "@/lib/db/adapters/drizzle/drizzle-time-log-template.repository";
import { getRepositories, isUserPersistenceReady } from "@/lib/db";
import {
  TimeLogTemplateNotFoundError,
} from "@/lib/db/ports/time-log-template.repository.port";
import {
  adminUpdateTimeLogTemplateBodySchema,
} from "@/lib/schemas/time-log-template";
import { templateRowToDto } from "@/lib/time-log/template-dto";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isIronSessionConfigured() || !isUserPersistenceReady()) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const session = await getTaskPilotSession();
  if (session.userRole !== "super_admin") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const currentAdminId = session.taskPilotUserId;
  if (!currentAdminId) {
    return NextResponse.json({ error: "Sesión inválida." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = adminUpdateTimeLogTemplateBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 },
    );
  }

  try {
    const row = await getRepositories().timeLogTemplate.adminUpdate(
      currentAdminId,
      id,
      parsed.data,
    );
    // adminUpdate puede actuar sobre plantillas personales (con userId),
    // así que resolvemos el authorName vía un lookup puntual.
    const authorNames = row.userId
      ? await fetchAuthorNames([row.userId])
      : new Map<string, string>();
    return NextResponse.json({
      template: templateRowToDto(
        row,
        row.userId ? authorNames.get(row.userId) ?? null : null,
      ),
    });
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
  if (!isIronSessionConfigured() || !isUserPersistenceReady()) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const session = await getTaskPilotSession();
  if (session.userRole !== "super_admin") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 });
  }

  try {
    await getRepositories().timeLogTemplate.adminDelete(id);
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
