import { NextResponse } from "next/server";

import { getAuthBaseUrl } from "@/lib/auth/entra";
import { destroyTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { usesServerEnvPat } from "@/lib/azure-devops/resolve-auth";

export const dynamic = "force-dynamic";

async function clearSession() {
  if (!isIronSessionConfigured()) return;
  await destroyTaskPilotSession();
}

function redirectHome(search: string) {
  const response = NextResponse.redirect(new URL(search, getAuthBaseUrl()));
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}

export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  await clearSession();
  const search = usesServerEnvPat() ? "/" : "/?signed_out=1";
  return redirectHome(search);
}
