import { NextResponse } from "next/server";

import { saveAdoContextDefaults } from "@/lib/ado/save-ado-context-defaults";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";
import { saveAdoContextDefaultsSchema } from "@/lib/schemas/ado-context-defaults";

export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return apiErrorResponse(USER_MESSAGES.invalidJsonBody, 400);
  }

  const parsed = saveAdoContextDefaultsSchema.safeParse(body);
  if (!parsed.success) {
    return apiErrorResponse(
      parsed.error.issues[0]?.message ?? USER_MESSAGES.invalidForm,
      400,
    );
  }

  try {
    const result = await saveAdoContextDefaults(parsed.data);
    if (!result.ok) {
      return apiErrorResponse(result.message, 400);
    }

    return NextResponse.json({ ok: true });
  } catch (cause) {
    return apiErrorFromCause(
      "ado/context-defaults PUT",
      cause,
      "No se pudo guardar el proyecto y equipo predeterminados.",
    );
  }
}
