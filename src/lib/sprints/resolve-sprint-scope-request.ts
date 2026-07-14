import "server-only";

import type { NextResponse } from "next/server";
import type { z } from "zod";

import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import type { SprintGoalScope } from "@/lib/db/ports/sprint-story-goal.repository.port";
import { apiErrorResponse } from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";

type SprintScopeQueryBase = {
  project: string;
  team: string;
  sprintPath: string;
};

export type ResolvedSprintScopeRequest<Query> =
  | { ok: true; scope: SprintGoalScope; query: Query }
  | { ok: false; response: NextResponse };

/**
 * Parsea y valida los query params de scope (`project`, `team`, `sprintPath`
 * más los `extraParams` indicados) y resuelve el caller de ADO. Cuando la
 * validación o la auth fallan devuelve la respuesta de error lista para
 * retornar desde el route handler.
 */
export async function resolveSprintScopeRequest<Query extends SprintScopeQueryBase>(
  req: Request,
  schema: z.ZodType<Query>,
  extraParams: readonly string[] = [],
): Promise<ResolvedSprintScopeRequest<Query>> {
  const url = new URL(req.url);
  const rawQuery: Record<string, unknown> = {
    project: url.searchParams.get("project") ?? "",
    team: url.searchParams.get("team") ?? "",
    sprintPath: url.searchParams.get("sprintPath") ?? "",
  };
  for (const param of extraParams) {
    rawQuery[param] = url.searchParams.get(param) ?? undefined;
  }

  const parsed = schema.safeParse(rawQuery);
  if (!parsed.success) {
    return {
      ok: false,
      response: apiErrorResponse(
        parsed.error.issues[0]?.message ?? USER_MESSAGES.invalidForm,
        400,
      ),
    };
  }

  const caller = await requireAdoCaller();
  if (!caller.ok) {
    return {
      ok: false,
      response: apiErrorResponse(ADO_SIGN_IN_REQUIRED_MESSAGE, 401),
    };
  }

  return {
    ok: true,
    scope: {
      organization: caller.auth.organization,
      project: parsed.data.project,
      team: parsed.data.team,
      sprintPath: parsed.data.sprintPath,
    },
    query: parsed.data,
  };
}
