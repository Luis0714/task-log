import { NextResponse } from "next/server";
import { z } from "zod";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { withAdoProject } from "@/lib/azure-devops/projects";
import { changeWorkItemParent } from "@/lib/azure-devops/work-items";
import { resolveAdoCaller } from "@/lib/azure-devops/resolve-auth";
import { apiErrorResponse } from "@/lib/errors/api-error-response";
import { logApiError } from "@/lib/errors/log-api-error";
import { USER_MESSAGES } from "@/lib/errors/user-messages";

const bulkReassignParentBodySchema = z.object({
  project: z.string().min(1),
  newParentId: z.number().int().positive(),
  ids: z.array(z.number().int().positive()).min(1).max(500),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiErrorResponse(USER_MESSAGES.invalidJsonBody, 400);
  }

  const parsed = bulkReassignParentBodySchema.safeParse(body);
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

  const { project, newParentId, ids } = parsed.data;
  const scopedAuth = withAdoProject(auth, project);
  const expected = ids.length;
  const failed: number[] = [];
  let updated = 0;

  for (const workItemId of ids) {
    try {
      const result = await changeWorkItemParent(workItemId, newParentId, scopedAuth);
      if (result.ok) {
        updated += 1;
      } else {
        logApiError("ado/work-items bulk-reassign-parent", {
          workItemId,
          status: result.status,
          body: result.body,
        });
        failed.push(workItemId);
      }
    } catch (cause) {
      logApiError("ado/work-items bulk-reassign-parent", { workItemId, cause });
      failed.push(workItemId);
    }
  }

  return NextResponse.json({ ok: true, expected, updated, failed });
}
