import { NextResponse } from "next/server";

import { buildProcessProfileForAuth, resolveProcessProfile } from "@/lib/azure-devops/process-profile";
import { getRepositories } from "@/lib/db";
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
import { getTaskPilotSession } from "@/lib/auth/session";

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

  // Campos admin requieren rol super_admin
  const hasAdminFields =
    parsed.data.completedWorkField !== undefined ||
    parsed.data.originalEstimateField !== undefined ||
    parsed.data.activityField !== undefined ||
    parsed.data.taskWorkItemType !== undefined ||
    parsed.data.bugWorkItemType !== undefined ||
    parsed.data.backlogItemType !== undefined ||
    parsed.data.taskTodoState !== undefined ||
    parsed.data.taskDoneState !== undefined;

  if (hasAdminFields) {
    const session = await getTaskPilotSession();
    if (session.userRole !== "super_admin") {
      return apiErrorResponse("No tienes permisos para modificar la configuración del proyecto.", 403);
    }
  }

  try {
    const current = await resolveProcessProfile(authResult.auth);
    const profile = applyManualProcessProfileChanges(current, {
      workingDateField: parsed.data.workingDateField,
      timezone: parsed.data.timezone,
      completedWorkField: parsed.data.completedWorkField,
      originalEstimateField: parsed.data.originalEstimateField,
      activityField: parsed.data.activityField,
      taskWorkItemType: parsed.data.taskWorkItemType,
      bugWorkItemType: parsed.data.bugWorkItemType,
      backlogItemType: parsed.data.backlogItemType,
      taskTodoState: parsed.data.taskTodoState,
      taskDoneState: parsed.data.taskDoneState,
    });

    // Persistir en BD para que sea compartido entre usuarios del mismo proyecto
    if (hasAdminFields) {
      await getRepositories().projectConfiguration.upsert(
        authResult.auth.organization,
        authResult.auth.project,
        {
          workingDateField: profile.workingDateField,
          timezone: profile.timezone,
          completedWorkField: profile.completedWorkField,
          originalEstimateField: profile.originalEstimateField,
          activityField: profile.activityField,
          taskWorkItemType: profile.taskWorkItemType,
          bugWorkItemType: profile.bugWorkItemType,
          backlogItemType: profile.backlogItemType,
          taskTodoState: profile.taskTodoState,
          taskDoneState: profile.taskDoneState,
          configSource: "manual",
        },
      );
    }

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

  // Solo admin puede forzar re-descubrimiento (borra config manual)
  const session = await getTaskPilotSession();
  if (session.userRole !== "super_admin") {
    return apiErrorResponse("No tienes permisos para actualizar la configuración del proyecto.", 403);
  }

  try {
    // Eliminar fila en BD para forzar re-descubrimiento completo
    await getRepositories().projectConfiguration.upsert(
      authResult.auth.organization,
      authResult.auth.project,
      {
        workingDateField: null,
        timezone: null,
        completedWorkField: null,
        originalEstimateField: null,
        activityField: null,
        taskWorkItemType: null,
        bugWorkItemType: null,
        backlogItemType: null,
        taskTodoState: null,
        taskDoneState: null,
        configSource: "auto",
        discoveredAt: null,
      },
    );

    const profile = await buildProcessProfileForAuth(authResult.auth);
    const taskDateFieldOptions = await listTaskDateFieldOptions(
      authResult.auth,
      profile.taskWorkItemType,
    );

    return NextResponse.json({ profile, taskDateFieldOptions });
  } catch (cause) {
    return apiErrorFromCause(
      "settings/process-profile POST",
      cause,
      USER_MESSAGES.settingsRefreshFailed,
    );
  }
}
