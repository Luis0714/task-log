import { postAuthJson } from "@/services/auth/post-auth-json";

export type LoginLocalPayload = {
  email: string;
  password: string;
};

export type LoginLocalFailureReason =
  | "invalid_credentials"
  | "user_not_found"
  | "microsoft_account";

export type LoginLocalResult =
  | { ok: true }
  | { ok: false; errorMessage: string; reason?: LoginLocalFailureReason };

export async function loginLocal(
  payload: LoginLocalPayload,
): Promise<LoginLocalResult> {
  const result = await postAuthJson(
    "/api/auth/login",
    payload,
    "No pudimos iniciar sesión. Inténtalo de nuevo.",
  );

  if (result.ok) return { ok: true };

  return {
    ok: false,
    errorMessage: result.errorMessage,
    reason: result.reason as LoginLocalFailureReason | undefined,
  };
}
