import { NextResponse } from "next/server";
import { z } from "zod";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { deleteWorkItem } from "@/lib/azure-devops/work-items";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { apiErrorResponse } from "@/lib/errors/api-error-response";
import { logApiError } from "@/lib/errors/log-api-error";
import { USER_MESSAGES } from "@/lib/errors/user-messages";

const bulkDeleteBodySchema = z.object({
  project: z.string().min(1),
  ids: z.array(z.number().int().positive()).min(1).max(500),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiErrorResponse(USER_MESSAGES.invalidJsonBody, 400);
  }

  const parsed = bulkDeleteBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiErrorResponse(
      parsed.error.issues[0]?.message ?? USER_MESSAGES.invalidPayload,
      400,
    );
  }

  const auth = await resolveAdoCaller({ persistOAuthTokens: true });
  if (!auth) {
    return apiErrorResponse(ADO_SIGN_IN_REQUIRED_MESSAGE, 401);
  }

  const { project, ids } = parsed.data;
  const scopedAuth = withAdoProject(auth, project);
  const expected = ids.length;
  const failed: number[] = [];
  let deleted = 0;

  // Itera secuencialmente: si una llamada falla, las siguientes se siguen intentando.
  // Se reportan al final para que la UI muestre un único resumen (esperadas vs eliminadas).
  for (const workItemId of ids) {
    try {
      const result = await deleteWorkItem(workItemId, scopedAuth);
      if (result.ok) {
        deleted += 1;
      } else {
        logApiError("ado/work-items bulk-delete", {
          workItemId,
          status: result.status,
          body: result.body,
        });
        failed.push(workItemId);
      }
    } catch (cause) {
      logApiError("ado/work-items bulk-delete", { workItemId, cause });
      failed.push(workItemId);
    }
  }

  return NextResponse.json({ ok: true, expected, deleted, failed });
}
