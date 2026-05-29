import { NextResponse } from "next/server";

import { getConnectAuthOptions } from "@/lib/auth/connect-auth-options";
import { validatePatConnection } from "@/lib/auth/validate-pat-connection";
import { fetchCurrentAdoProfile } from "@/lib/azure-devops/profile";
import { clearSessionCredentials, getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { connectPatBodySchema } from "@/lib/schemas/connect-pat";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { patEnabled } = getConnectAuthOptions();

  if (!patEnabled) {
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

  const { organization, project, pat } = parsed.data;

  const validation = await validatePatConnection({ organization, project, pat });
  if (!validation.ok) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  const caller = {
    mode: "pat" as const,
    organization: organization.trim(),
    project: project.trim(),
    pat: pat.trim(),
  };

  const profile = await fetchCurrentAdoProfile(caller);

  const session = await getTaskPilotSession();
  clearSessionCredentials(session);
  session.sessionAuthMethod = "pat";
  session.azdoPat = pat.trim();
  session.defaultOrg = organization.trim();
  session.defaultProject = project.trim();
  if (profile) {
    session.adoProfile = profile;
  }
  await session.save();

  return NextResponse.json({ ok: true });
}
