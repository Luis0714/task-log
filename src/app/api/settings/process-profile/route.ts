import { NextResponse } from "next/server";

import { buildProcessProfileForAuth, resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import { writeProcessProfileToSession } from "@/lib/azure-devops/process-profile-session";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
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
    return apiErrorResponse(
      parsed.error.issues[0]?.message ?? USER_MESSAGES.invalidForm,
      400,
    );
  }

  const authResult = await resolveSettingsAuth(parsed.data.project);
  if (!authResult.ok) {
    return apiErrorResponse(authResult.error, authResult.status);
  }

  try {
    const [profile, taskDateFieldOptions] = await Promise.all([
      resolveProcessProfile(authResult.auth),
      listTaskDateFieldOptions(authResult.auth),
    ]);

    return NextResponse.json({ profile, taskDateFieldOptions });
  } catch (cause) {
    return apiErrorFromCause(
      "settings/process-profile GET",
      cause,
      USER_MESSAGES.settingsLoadFailed,
    );
  }
}

export async function PATCH(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiErrorResponse(USER_MESSAGES.invalidJsonBody, 400);
  }

  const parsed = updateSettingsProcessProfileSchema.safeParse(body);
  if (!parsed.success) {
    return apiErrorResponse(
      parsed.error.issues[0]?.message ?? USER_MESSAGES.invalidForm,
      400,
    );
  }

  const authResult = await resolveSettingsAuth(parsed.data.project);
  if (!authResult.ok) {
    return apiErrorResponse(authResult.error, authResult.status);
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
    return apiErrorFromCause(
      "settings/process-profile PATCH",
      cause,
      USER_MESSAGES.settingsSaveFailed,
    );
  }
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiErrorResponse(USER_MESSAGES.invalidJsonBody, 400);
  }

  const parsed = settingsProcessProfileQuerySchema.safeParse(body);
  if (!parsed.success) {
    return apiErrorResponse(
      parsed.error.issues[0]?.message ?? USER_MESSAGES.invalidForm,
      400,
    );
  }

  const authResult = await resolveSettingsAuth(parsed.data.project);
  if (!authResult.ok) {
    return apiErrorResponse(authResult.error, authResult.status);
  }

  try {
    const profile = await buildProcessProfileForAuth(authResult.auth);
    await writeProcessProfileToSession(authResult.auth, profile);
    const taskDateFieldOptions = await listTaskDateFieldOptions(authResult.auth);

    return NextResponse.json({ profile, taskDateFieldOptions });
  } catch (cause) {
    return apiErrorFromCause(
      "settings/process-profile POST",
      cause,
      USER_MESSAGES.settingsRefreshFailed,
    );
  }
}
