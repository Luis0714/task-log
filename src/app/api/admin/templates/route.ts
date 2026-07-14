import "server-only";

import { NextResponse } from "next/server";

import { getRepositories } from "@/lib/db";
import { adminCreateTimeLogTemplateBodySchema } from "@/lib/schemas/time-log-template";
import type { TimeLogTemplateDto } from "@/lib/schemas/time-log-template";
import { templateRowToDto } from "@/lib/time-log/template-dto";
import {
  requireSuperAdminSession,
  templateRowToDtoWithAuthor,
} from "@/app/api/admin/templates/helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireSuperAdminSession();
  if (!auth.ok) return auth.response;

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
  const auth = await requireSuperAdminSession();
  if (!auth.ok) return auth.response;
  if (!auth.adminId) {
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
      auth.adminId,
      parsed.data,
    );
    return NextResponse.json(
      { template: await templateRowToDtoWithAuthor(row) },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "No pudimos crear la plantilla." },
      { status: 500 },
    );
  }
}
