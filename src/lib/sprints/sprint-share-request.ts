import { ADO_SIGN_IN_REQUIRED_MESSAGE } from "@/lib/auth/ado-auth-messages";
import { requireAdoCaller } from "@/lib/ado/require-ado-caller";
import {
  apiErrorFromCause,
  apiErrorResponse,
} from "@/lib/errors/api-error-response";
import { USER_MESSAGES } from "@/lib/errors/user-messages";

type SharePayloadLoadResult<TPayload> =
  | { ok: true; payload: TPayload }
  | { ok: false; error: string; status: number };

type SharePayloadParseResult<TParsed> =
  | { ok: true; data: TParsed }
  | { ok: false; errorMessage?: string };

export async function loadSprintSharePayloadFromRequest<TParsed, TPayload>(
  req: Request,
  parse: (request: Request) => SharePayloadParseResult<TParsed> | Promise<SharePayloadParseResult<TParsed>>,
  load: (
    organization: string,
    data: TParsed,
  ) => Promise<SharePayloadLoadResult<TPayload>>,
): Promise<
  | { ok: true; payload: TPayload }
  | { ok: false; response: Response }
> {
  const parsed = await parse(req);

  if (!parsed.ok) {
    return {
      ok: false as const,
      response: apiErrorResponse(
        parsed.errorMessage ?? USER_MESSAGES.invalidForm,
        400,
      ),
    };
  }

  const caller = await requireAdoCaller();
  if (!caller.ok) {
    return {
      ok: false as const,
      response: apiErrorResponse(ADO_SIGN_IN_REQUIRED_MESSAGE, 401),
    };
  }

  const result = await load(caller.auth.organization, parsed.data);

  if (!result.ok) {
    return {
      ok: false as const,
      response: apiErrorResponse(result.error, result.status),
    };
  }

  return { ok: true as const, payload: result.payload };
}

export function sharePayloadErrorResponse(
  context: string,
  cause: unknown,
  fallback: string,
) {
  return apiErrorFromCause(context, cause, fallback);
}
