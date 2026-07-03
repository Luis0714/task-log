import "server-only";

import { NextResponse } from "next/server";

import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { getRepositories, isUserPersistenceReady } from "@/lib/db";

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
    const users = await getRepositories().user.listAllWithRoles();
    return NextResponse.json({ users });
  } catch {
    return NextResponse.json(
      { error: "No pudimos cargar los usuarios." },
      { status: 500 },
    );
  }
}
