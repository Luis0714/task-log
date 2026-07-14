import "server-only";

import { NextResponse } from "next/server";

import { getRepositories } from "@/lib/db";
import {
  TimeLogTemplateNotFoundError,
} from "@/lib/db/ports/time-log-template.repository.port";
import {
  adminUpdateTimeLogTemplateBodySchema,
} from "@/lib/schemas/time-log-template";
import {
  requireSuperAdminSession,
  templateRowToDtoWithAuthor,
} from "@/app/api/admin/templates/helpers";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperAdminSession();
  if (!auth.ok) return auth.response;
  if (!auth.adminId) {
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
      auth.adminId,
      id,
      parsed.data,
    );
    return NextResponse.json({ template: await templateRowToDtoWithAuthor(row) });
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
  const auth = await requireSuperAdminSession();
  if (!auth.ok) return auth.response;

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
