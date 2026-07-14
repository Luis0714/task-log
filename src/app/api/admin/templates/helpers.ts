import "server-only";

import { NextResponse } from "next/server";

import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { fetchAuthorNames } from "@/lib/db/adapters/drizzle/drizzle-time-log-template.repository";
import { isUserPersistenceReady } from "@/lib/db";
import type { TimeLogTemplateDto } from "@/lib/schemas/time-log-template";
import { templateRowToDto } from "@/lib/time-log/template-dto";

export type SuperAdminSession =
  | { ok: true; adminId: string | null }
  | { ok: false; response: NextResponse };

export async function requireSuperAdminSession(): Promise<SuperAdminSession> {
  if (!isIronSessionConfigured() || !isUserPersistenceReady()) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autorizado." }, { status: 403 }),
    };
  }
  const session = await getTaskPilotSession();
  if (session.userRole !== "super_admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autorizado." }, { status: 403 }),
    };
  }
  return { ok: true, adminId: session.taskPilotUserId ?? null };
}

/**
 * DTO de plantilla resolviendo `authorName` con un lookup puntual: las rutas
 * admin pueden actuar sobre plantillas personales (con userId) cuyo autor no
 * es el usuario actual.
 */
export async function templateRowToDtoWithAuthor(
  row: Parameters<typeof templateRowToDto>[0],
): Promise<TimeLogTemplateDto> {
  const authorNames = row.userId
    ? await fetchAuthorNames([row.userId])
    : new Map<string, string>();
  return templateRowToDto(
    row,
    row.userId ? authorNames.get(row.userId) ?? null : null,
  );
}
