import { NextResponse } from "next/server";

import { saveDefaultRepository } from "@/lib/ado/save-default-repository";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { saveDefaultRepositorySchema } from "@/lib/schemas/ado-repository-defaults";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return apiErrorResponse(USER_MESSAGES.invalidJsonBody, 400);
  }

  const parsed = saveDefaultRepositorySchema.safeParse(body);
  if (!parsed.success) {
    return apiErrorResponse(
      parsed.error.issues[0]?.message ?? USER_MESSAGES.invalidForm,
      400,
    );
  }

  try {
    const result = await saveDefaultRepository(parsed.data);
    if (!result.ok) {
      return apiErrorResponse(result.message, 400);
    }

    return NextResponse.json({ ok: true });
  } catch (cause) {
    return apiErrorFromCause(
      "ado/repository-defaults PUT",
      cause,
      "No se pudo guardar el repositorio predeterminado.",
    );
  }
}
