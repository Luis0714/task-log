import "server-only";

import { NextResponse } from "next/server";

import {
  ASSIGNMENT_ERROR_CODES,
  ASSIGNMENT_HTTP_STATUS,
  ASSIGNMENT_USER_MESSAGES,
  type AssignmentErrorCode,
  type AssignmentErrorKey,
  isAssignmentErrorKey,
} from "@/lib/assignments/error-codes";
import { getDb } from "@/lib/db/client";
import { roles } from "@/lib/db/schema";
import { getTaskPilotSession, isIronSessionConfigured } from "@/lib/auth/session";
import { getServerAuthBootstrap } from "@/lib/auth/server-state";
import { isManagementRole } from "@/lib/auth/management-roles";
import { USER_MESSAGES } from "@/lib/errors/user-messages";

export async function requireManagementUser(): Promise<
  | { ok: true; userId: string; roleName: string | null }
  | { ok: false; status: number; error: string }
> {
  if (!isIronSessionConfigured()) {
    return { ok: false, status: 401, error: "No autorizado." };
  }
  const session = await getTaskPilotSession();
  const userId = session.taskPilotUserId?.trim();
  if (!userId) {
    return { ok: false, status: 401, error: "No autorizado." };
  }
  const bootstrap = await getServerAuthBootstrap();
  if (!bootstrap.userSessionActive) {
    return { ok: false, status: 401, error: "No autorizado." };
  }
  if (!isManagementRole(bootstrap.userRole)) {
    return { ok: false, status: 403, error: "No autorizado." };
  }
  return { ok: true, userId, roleName: bootstrap.userRole };
}

export type AssignmentMutationContext =
  | { ok: true; id: string; userId: string; roleName: string | null }
  | { ok: false; response: NextResponse };

/**
 * Preámbulo compartido de las rutas de mutación `/api/assignments/[id]/*`:
 * exige un usuario de gestión y un `id` presente en la ruta.
 */
export async function requireAssignmentMutationContext(
  params: Promise<{ id: string }>,
): Promise<AssignmentMutationContext> {
  const auth = await requireManagementUser();
  if (!auth.ok) {
    return {
      ok: false,
      response: NextResponse.json({ error: auth.error }, { status: auth.status }),
    };
  }

  const { id } = await params;
  if (!id) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: USER_MESSAGES.invalidPayload },
        { status: 400 },
      ),
    };
  }

  return { ok: true, id, userId: auth.userId, roleName: auth.roleName };
}

export async function readJsonBody(
  req: Request,
): Promise<{ ok: true; body: unknown } | { ok: false; response: NextResponse }> {
  try {
    return { ok: true, body: await req.json() };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: USER_MESSAGES.invalidJsonBody },
        { status: 400 },
      ),
    };
  }
}

export function assignmentNotFoundResponse(): NextResponse {
  const key: AssignmentErrorKey = "notFound";
  return NextResponse.json(
    { error: ASSIGNMENT_USER_MESSAGES[key], code: ASSIGNMENT_ERROR_CODES.notFound },
    { status: ASSIGNMENT_HTTP_STATUS[key] },
  );
}

function assignmentCodeToKey(
  code: AssignmentErrorCode,
  fallback: AssignmentErrorKey,
): AssignmentErrorKey {
  for (const [key, value] of Object.entries(ASSIGNMENT_ERROR_CODES)) {
    if (value === code && isAssignmentErrorKey(key)) return key;
  }
  return fallback;
}

/**
 * Respuesta 4xx para errores de validación de schema cuyos mensajes son
 * códigos de `ASSIGNMENT_ERROR_CODES`. `fallbackKey` se usa cuando el issue
 * no trae un código reconocible.
 */
export function assignmentSchemaErrorResponse(
  rawMessage: string | undefined,
  fallbackKey: AssignmentErrorKey,
): NextResponse {
  const code = (
    typeof rawMessage === "string" ? rawMessage : ASSIGNMENT_ERROR_CODES[fallbackKey]
  ) as AssignmentErrorCode;
  const key = assignmentCodeToKey(code, fallbackKey);
  return NextResponse.json(
    { error: ASSIGNMENT_USER_MESSAGES[key], code },
    { status: ASSIGNMENT_HTTP_STATUS[key] ?? 400 },
  );
}

export type AssignmentRoleOption = {
  id: string;
  name: string;
  displayName: string;
};

export async function listAssignmentRoleOptions(): Promise<AssignmentRoleOption[]> {
  const rows = await getDb().select().from(roles);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    displayName: r.displayName,
  }));
}
