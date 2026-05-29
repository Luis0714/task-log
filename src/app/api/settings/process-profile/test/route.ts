import { NextResponse } from "next/server";

import { resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import { testSettingsProcessProfileSchema } from "@/lib/schemas/settings-process-profile";
import { applyManualProcessProfileChanges } from "@/lib/settings/manual-process-profile";
import { resolveSettingsAuth } from "@/lib/settings/resolve-settings-auth";
import { testProcessProfileConfiguration } from "@/lib/settings/test-process-profile";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const parsed = testSettingsProcessProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 },
    );
  }

  const authResult = await resolveSettingsAuth(parsed.data.project);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const stored = await resolveProcessProfile(authResult.auth);
    const profile =
      parsed.data.workingDateField || parsed.data.timezone
        ? applyManualProcessProfileChanges(stored, {
            workingDateField: parsed.data.workingDateField ?? stored.workingDateField,
            timezone: parsed.data.timezone ?? stored.timezone,
          })
        : stored;
    const result = await testProcessProfileConfiguration(authResult.auth, profile);
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "No se pudo probar la configuración.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
