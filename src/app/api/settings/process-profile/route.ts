import { NextResponse } from "next/server";

import { buildProcessProfileForAuth, resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import { writeProcessProfileToSession } from "@/lib/azure-devops/process-profile-session";
import { applyManualProcessProfileChanges } from "@/lib/settings/manual-process-profile";
import { resolveSettingsAuth } from "@/lib/settings/resolve-settings-auth";
import { listTaskDateFieldOptions } from "@/lib/settings/task-date-field-options";
import {
  settingsProcessProfileQuerySchema,
  updateSettingsProcessProfileSchema,
} from "@/lib/schemas/settings-process-profile";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = settingsProcessProfileQuerySchema.safeParse({
    project: url.searchParams.get("project") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Parámetros inválidos." },
      { status: 400 },
    );
  }

  const authResult = await resolveSettingsAuth(parsed.data.project);
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const [profile, taskDateFieldOptions] = await Promise.all([
      resolveProcessProfile(authResult.auth),
      listTaskDateFieldOptions(authResult.auth),
    ]);

    return NextResponse.json({ profile, taskDateFieldOptions });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "No se pudo cargar la configuración.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function PATCH(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const parsed = updateSettingsProcessProfileSchema.safeParse(body);
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
    const current = await resolveProcessProfile(authResult.auth);
    const profile = applyManualProcessProfileChanges(current, {
      workingDateField: parsed.data.workingDateField,
      timezone: parsed.data.timezone,
    });

    await writeProcessProfileToSession(authResult.auth, profile);

    return NextResponse.json({ profile });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "No se pudo guardar la configuración.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const parsed = settingsProcessProfileQuerySchema.safeParse(body);
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
    const profile = await buildProcessProfileForAuth(authResult.auth);
    await writeProcessProfileToSession(authResult.auth, profile);
    const taskDateFieldOptions = await listTaskDateFieldOptions(authResult.auth);

    return NextResponse.json({ profile, taskDateFieldOptions });
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : "No se pudo actualizar desde Azure DevOps.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
