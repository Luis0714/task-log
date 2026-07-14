import "server-only";

import { NextResponse } from "next/server";

import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { isUserPersistenceReady } from "@/lib/db";

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