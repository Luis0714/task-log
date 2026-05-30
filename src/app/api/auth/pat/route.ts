import { NextResponse } from "next/server";

import { getConnectAuthOptions } from "@/lib/auth/connect-auth-options";
import { hydratePatSession } from "@/lib/auth/hydrate-pat-session";
import { validatePatConnection } from "@/lib/auth/validate-pat-connection";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { connectPatBodySchema } from "@/lib/schemas/connect-pat";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { patReady } = getConnectAuthOptions();

  if (!patReady) {
    return NextResponse.json(
      { error: "El inicio con código de acceso no está disponible." },
      { status: 403 },
    );
  }

  if (!isIronSessionConfigured()) {
    return NextResponse.json(
      { error: "La sesión no está configurada en el servidor." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }

  const parsed = connectPatBodySchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { pat, organization, project, team } = parsed.data;
  const trimmedTeam = team?.trim();

  const validation = await validatePatConnection({ organization, project, pat });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  const session = await getTaskPilotSession();
  await hydratePatSession(session, {
    pat,
    organization,
    project,
    team: trimmedTeam,
  });
  await session.save();

  return NextResponse.json({ ok: true });
}
