import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireSuperAdminSession } from "@/app/api/admin/_shared/super-admin-session";
import { getRepositories } from "@/lib/db";

export const dynamic = "force-dynamic";

const patchBodySchema = z
  .object({
    roleId: z.uuid().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => d.roleId !== undefined || d.isActive !== undefined, {
    message: "Indica al menos un campo a actualizar.",
  });

type PatchBody = z.infer<typeof patchBodySchema>;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperAdminSession();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const selfBlock = preventSelfEdit(id, auth.adminId);
  if (selfBlock) return selfBlock;

  const bodyResult = await parseJsonBody(req);
  if (!bodyResult.ok) return bodyResult.response;

  const parsed = patchBodySchema.safeParse(bodyResult.data);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 },
    );
  }

  if (parsed.data.roleId !== undefined || parsed.data.isActive !== undefined) {
    const protectionError = await ensureCanModifyTarget(id, parsed.data);
    if (protectionError) return protectionError;
  }

  return updateUserSafely(id, parsed.data);
}

function preventSelfEdit(id: string, adminId: string | null): NextResponse | null {
  if (id !== adminId) return null;
  return NextResponse.json(
    { error: "No puedes modificar tu propio usuario." },
    { status: 400 },
  );
}

type JsonBodyResult = { ok: true; data: unknown } | { ok: false; response: NextResponse };

async function parseJsonBody(req: Request): Promise<JsonBodyResult> {
  try {
    return { ok: true, data: await req.json() };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "JSON inválido." }, { status: 400 }),
    };
  }
}

async function ensureCanModifyTarget(
  id: string,
  patch: PatchBody,
): Promise<NextResponse | null> {
  const allUsers = await getRepositories().user.listAllWithRoles();
  const target = allUsers.find((u) => u.id === id);
  if (!target) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }
  if (target.roleName !== "super_admin") return null;

  const wouldDemote = patch.roleId !== undefined && target.roleId !== patch.roleId;
  const wouldDisable = patch.isActive === false && target.isActive;
  if (!wouldDemote && !wouldDisable) return null;

  const activeSuperAdmins = allUsers.filter(
    (u) => u.roleName === "super_admin" && u.isActive,
  ).length;
  if (activeSuperAdmins <= 1) {
    return NextResponse.json(
      {
        error: "No puedes deshabilitar ni cambiar el rol del único SuperAdmin activo.",
      },
      { status: 400 },
    );
  }
  return null;
}

async function updateUserSafely(id: string, patch: PatchBody): Promise<NextResponse> {
  try {
    await getRepositories().user.updateUser(id, patch);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No pudimos actualizar el usuario." },
      { status: 500 },
    );
  }
}