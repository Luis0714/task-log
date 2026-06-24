import "server-only";

import { NextResponse } from "next/server";

import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import {
  fetchAuthorNames,
} from "@/lib/db/adapters/drizzle/drizzle-time-log-template.repository";
import { getRepositories, isUserPersistenceReady } from "@/lib/db";
import { adminCreateTimeLogTemplateBodySchema } from "@/lib/schemas/time-log-template";
import type { TimeLogTemplateDto } from "@/lib/schemas/time-log-template";
import { templateRowToDto } from "@/lib/time-log/template-dto";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isIronSessionConfigured() || !isUserPersistenceReady()) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  const session = await getTaskPilotSession();
  if (session.userRole !== "super_admin") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  try {
    const rows = await getRepositories().timeLogTemplate.adminListAll();
    // `adminListAll` hace LEFT JOIN con users; mapeamos `authorDisplayName`
    // → `authorName` en el DTO.
    const templates: TimeLogTemplateDto[] = rows.map((r) =>
      templateRowToDto(r, r.authorDisplayName ?? null),
    );
    return NextResponse.json({ templates });
  } catch {
    return NextResponse.json(
      { error: "No pudimos cargar las plantillas." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = adminCreateTimeLogTemplateBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 },
    );
  }

  try {
    // adminCreate puede persistir como personal (userId = admin) o como
    // sistema (userId = NULL según scope).
    const row = await getRepositories().timeLogTemplate.adminCreate(
      currentAdminId,
      parsed.data,
    );
    const authorNames = row.userId
      ? await fetchAuthorNames([row.userId])
      : new Map<string, string>();
    return NextResponse.json(
      {
        template: templateRowToDto(
          row,
          row.userId ? authorNames.get(row.userId) ?? null : null,
        ),
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "No pudimos crear la plantilla." },
      { status: 500 },
    );
  }
}
