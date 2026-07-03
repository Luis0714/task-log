import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";

import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { getRepositories, isUserPersistenceReady } from "@/lib/db";

export const dynamic = "force-dynamic";

const patchBodySchema = z
  .object({
    roleId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => d.roleId !== undefined || d.isActive !== undefined, {
    message: "Indica al menos un campo a actualizar.",
  });

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

  const { id } = await params;

  if (id === session.taskPilotUserId) {
    return NextResponse.json(
      { error: "No puedes modificar tu propio usuario." },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 },
    );
  }

  const wouldChangeRole =
    parsed.data.roleId !== undefined;
  const wouldChangeActive = parsed.data.isActive !== undefined;

  if (wouldChangeRole || wouldChangeActive) {
    const allUsers = await getRepositories().user.listAllWithRoles();
    const target = allUsers.find((u) => u.id === id);

    if (!target) {
      return NextResponse.json(
        { error: "Usuario no encontrado." },
        { status: 404 },
      );
    }

    const isTargetSuperAdmin = target.roleName === "super_admin";
    if (isTargetSuperAdmin) {
      const isDemoting =
        wouldChangeRole && target.roleId !== parsed.data.roleId;
      const isDisabling =
        wouldChangeActive && parsed.data.isActive === false && target.isActive;

      if (isDemoting || isDisabling) {
        const activeSuperAdminCount = allUsers.filter(
          (u) => u.roleName === "super_admin" && u.isActive,
        ).length;

        if (activeSuperAdminCount <= 1) {
          return NextResponse.json(
            {
              error:
                "No puedes deshabilitar ni cambiar el rol del único SuperAdmin activo.",
            },
            { status: 400 },
          );
        }
      }
    }
  }

  try {
    await getRepositories().user.updateUser(id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "No pudimos actualizar el usuario." },
      { status: 500 },
    );
  }
}
