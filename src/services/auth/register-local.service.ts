import type { ConnectPatBody } from "@/lib/schemas/connect-pat";
import { postAuthJson } from "@/services/auth/post-auth-json";

export type RegisterLocalPayload = ConnectPatBody & {
  email: string;
  password: string;
};

export type RegisterLocalResult =
  | { ok: true }
  | { ok: false; errorMessage: string };

export async function registerLocalPat(
  payload: RegisterLocalPayload,
): Promise<RegisterLocalResult> {
  const result = await postAuthJson(
    "/api/auth/register",
    payload,
    "No pudimos crear tu cuenta. Revisa los datos e inténtalo de nuevo.",
  );

  if (result.ok) return { ok: true };

  return {
    ok: false,
    errorMessage: result.errorMessage,
  };
}
