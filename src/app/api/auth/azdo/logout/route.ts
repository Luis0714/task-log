import { NextResponse } from "next/server";

import { getAuthBaseUrl } from "@/lib/auth/entra";
import { isOAuthAuthMethod } from "@/lib/auth/auth-method";
import { getTaskPilotSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST() {
  if (!isOAuthAuthMethod()) {
    return NextResponse.json(
      { error: "OAuth deshabilitado. AZDO_AUTH_METHOD=pat está activo." },
      { status: 403 },
    );
  }

  const session = await getTaskPilotSession();
  session.destroy();
  await session.save();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  if (!isOAuthAuthMethod()) {
    return NextResponse.redirect(new URL("/", getAuthBaseUrl()));
  }

  const session = await getTaskPilotSession();
  session.destroy();
  await session.save();
  return NextResponse.redirect(new URL("/", getAuthBaseUrl()));
}
